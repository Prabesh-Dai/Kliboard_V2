import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setVisibilitySchema } from "@/lib/schemas/space.schema";
import { updateRateLimiter } from "@/lib/rate-limit";
import {
  accessCookieName,
  hashSpacePassword,
  isSpaceAccessConfigured,
} from "@/lib/space-access";
import {
  isContentEncryptionConfigured,
  readableContent,
  storedContent,
} from "@/lib/content-crypto";
import { PRIVATE_SPACES_UNAVAILABLE } from "@/lib/constants";

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
    .select("id, name, owner_id, content, is_private")
    .eq("name", name.toLowerCase())
    .single();

  if (!space) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (space.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    parsed.data.is_private &&
    (!isSpaceAccessConfigured() || !isContentEncryptionConfigured())
  ) {
    console.error("SPACE_ACCESS_SECRET or SPACE_CONTENT_KEY is not configured; refusing to make space private");
    return NextResponse.json({ error: PRIVATE_SPACES_UNAVAILABLE }, { status: 503 });
  }

  let plaintext: string;
  try {
    plaintext = readableContent(space);
  } catch (err) {
    console.error("Failed to decrypt space content", { space: space.name, err });
    return NextResponse.json({ error: "Couldn't read this space" }, { status: 500 });
  }

  const { data, error } = await admin
    .from("spaces")
    .update({
      is_private: parsed.data.is_private,
      password_hash: parsed.data.is_private
        ? await hashSpacePassword(parsed.data.password)
        : null,
      content: storedContent(plaintext, parsed.data.is_private),
    })
    .eq("id", space.id)
    .eq("content", space.content)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update visibility" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Space changed. Try again" }, { status: 409 });
  }

  const { password_hash: _, claim_token_hash: __, ...safeSpace } = data;
  const response = NextResponse.json({ ...safeSpace, content: plaintext });

  response.cookies.set(accessCookieName(space.name), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
