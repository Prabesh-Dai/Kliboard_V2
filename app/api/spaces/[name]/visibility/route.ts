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
    .select("id, name, owner_id")
    .eq("name", name.toLowerCase())
    .single();

  if (!space) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (space.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (parsed.data.is_private && !isSpaceAccessConfigured()) {
    console.error("SPACE_ACCESS_SECRET is missing or too short; refusing to make space private");
    return NextResponse.json({ error: PRIVATE_SPACES_UNAVAILABLE }, { status: 503 });
  }

  const { data, error } = await admin
    .from("spaces")
    .update({
      is_private: parsed.data.is_private,
      password_hash: parsed.data.is_private
        ? await hashSpacePassword(parsed.data.password)
        : null,
    })
    .eq("id", space.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to update visibility" },
      { status: 500 }
    );
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
