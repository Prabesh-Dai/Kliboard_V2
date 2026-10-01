import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setVisibilitySchema } from "@/lib/schemas/space.schema";
import { updateRateLimiter } from "@/lib/rate-limit";
import { isAdmin } from "@/lib/admin";
import { accessCookieName, hashSpacePassword } from "@/lib/space-access";
import { MAX_CONTENT_LENGTH } from "@/lib/constants";
import type { Database } from "@/lib/types/database.types";

interface FileRekey {
  id: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const [{ name }, headerList, supabase] = await Promise.all([
    params,
    headers(),
    createClient(),
  ]);
  const ip = headerList.get("x-forwarded-for") ?? "anonymous";
  const { success } = await updateRateLimiter.limit(ip);

  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = setVisibilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: space } = await admin
    .from("spaces")
    .select("id, name, owner_id, is_private, encryption_version")
    .eq("name", name.toLowerCase())
    .single();

  if (!space) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userIsAdmin = await isAdmin(user.id);
  if (space.owner_id !== user.id && !userIsAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (parsed.data.is_private && !space.owner_id) {
    return NextResponse.json(
      { error: "Claim this space before making it private" },
      { status: 403 }
    );
  }

  const { data: existingFiles } = await admin
    .from("files")
    .select("id, storage_path")
    .eq("space_id", space.id);

  const isRotation =
    parsed.data.is_private && space.is_private && Boolean(space.encryption_version);
  const rekeys = (parsed.data.files ?? []) as FileRekey[];

  if (!isRotation && (existingFiles?.length ?? 0) > 0) {
    const existingIds = new Set(existingFiles!.map((f) => f.id));
    const covered = new Set(rekeys.map((f) => f.id));
    if (
      rekeys.length !== existingIds.size ||
      [...existingIds].some((id) => !covered.has(id))
    ) {
      return NextResponse.json(
        { error: "Every file must be re-encrypted before changing visibility" },
        { status: 400 }
      );
    }
  }

  if (isRotation && parsed.data.content !== undefined) {
    return NextResponse.json(
      { error: "Changing the password does not re-encrypt content" },
      { status: 400 }
    );
  }

  if (
    !parsed.data.is_private &&
    parsed.data.content !== undefined &&
    parsed.data.content.length > MAX_CONTENT_LENGTH
  ) {
    return NextResponse.json({ error: "Content too long" }, { status: 400 });
  }

  const spaceUpdate: Database["public"]["Tables"]["spaces"]["Update"] =
    parsed.data.is_private
    ? {
        is_private: true,
        password_hash: await hashSpacePassword(parsed.data.encryption.auth_token),
        encryption_version: parsed.data.encryption.version,
        kdf_salt: parsed.data.encryption.kdf_salt,
        kdf_iterations: parsed.data.encryption.kdf_iterations,
        wrapped_dek: parsed.data.encryption.wrapped_dek,
      }
    : {
        is_private: false,
        password_hash: null,
        encryption_version: null,
        kdf_salt: null,
        kdf_iterations: null,
        wrapped_dek: null,
      };

  if (!isRotation && parsed.data.content !== undefined) {
    spaceUpdate.content = parsed.data.content;
  }

  const { data, error } = await admin
    .from("spaces")
    .update(spaceUpdate)
    .eq("id", space.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to update visibility" },
      { status: 500 }
    );
  }

  if (!isRotation && rekeys.length) {
    const encryptionVersion = parsed.data.is_private
      ? parsed.data.encryption.version
      : null;

    for (const file of rekeys) {
      const { error: fileError } = await admin
        .from("files")
        .update({
          storage_path: file.storage_path,
          filename: file.filename,
          mime_type: file.mime_type,
          size_bytes: file.size_bytes,
          encryption_version: encryptionVersion,
        })
        .eq("id", file.id)
        .eq("space_id", space.id);

      if (fileError) {
        console.error("Failed to swap re-encrypted file", {
          fileId: file.id,
          fileError,
        });
      }
    }

    const stalePaths = (existingFiles ?? [])
      .filter((f) => !rekeys.some((r) => r.storage_path === f.storage_path))
      .map((f) => f.storage_path);

    if (stalePaths.length) {
      const { error: removeError } = await admin.storage
        .from("space-files")
        .remove(stalePaths);
      if (removeError) {
        console.error("Failed to remove superseded objects", {
          stalePaths,
          removeError,
        });
      }
    }
  }

  const { password_hash: _, claim_token_hash: __, ...safeSpace } = data;
  const response = NextResponse.json(safeSpace);

  response.cookies.set(accessCookieName(space.name), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
