import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { hasSpaceAccess, SPACE_SECURITY_COLUMNS } from "@/lib/space-authz";
import { uploadRateLimiter } from "@/lib/rate-limit";
import {
  MAX_FILES_PER_SPACE,
  MAX_SPACE_STORAGE_BYTES,
} from "@/lib/constants";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "anonymous";
  const { success } = await uploadRateLimiter.limit(ip);

  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const [{ name }, supabase] = await Promise.all([params, createClient()]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: space } = await admin
    .from("spaces")
    .select(SPACE_SECURITY_COLUMNS)
    .eq("name", name.toLowerCase())
    .single();

  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  const userIsAdmin = await isAdmin(user.id);

  if (!(await hasSpaceAccess(space, user.id, userIsAdmin))) {
    return NextResponse.json(
      { error: "Password required", requires_password: true },
      { status: 403 }
    );
  }

  const isOwner = space.owner_id === user.id;
  if (space.is_locked && !isOwner && !userIsAdmin) {
    return NextResponse.json({ error: "Space is locked" }, { status: 403 });
  }

  const { data: existingFiles } = await admin
    .from("files")
    .select("size_bytes")
    .eq("space_id", space.id);

  if ((existingFiles?.length ?? 0) >= MAX_FILES_PER_SPACE) {
    return NextResponse.json(
      { error: `File limit reached (max ${MAX_FILES_PER_SPACE} files per space)` },
      { status: 413 }
    );
  }

  const currentTotal =
    existingFiles?.reduce((sum, f) => sum + f.size_bytes, 0) ?? 0;
  if (currentTotal >= MAX_SPACE_STORAGE_BYTES) {
    return NextResponse.json(
      { error: "Space storage limit exceeded (max 50MB total)" },
      { status: 413 }
    );
  }

  const path = `${space.name}/${crypto.randomUUID()}`;
  const { data: signed, error } = await admin.storage
    .from("space-files")
    .createSignedUploadUrl(path);

  if (error || !signed) {
    console.error("Failed to mint signed upload url", { path, error });
    return NextResponse.json(
      { error: "Could not start the upload" },
      { status: 500 }
    );
  }

  return NextResponse.json({ path: signed.path, token: signed.token });
}
