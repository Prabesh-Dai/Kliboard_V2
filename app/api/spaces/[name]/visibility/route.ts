import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setVisibilitySchema } from "@/lib/schemas/space.schema";
import { updateRateLimiter } from "@/lib/rate-limit";
import { isAdmin } from "@/lib/admin";
import { accessCookieName, hashSpacePassword } from "@/lib/space-access";

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
