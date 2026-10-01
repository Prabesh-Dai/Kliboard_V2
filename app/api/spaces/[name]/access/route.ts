import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySpaceAccessSchema } from "@/lib/schemas/space.schema";
import {
  passwordAttemptRateLimiter,
  spacePasswordRateLimiter,
} from "@/lib/rate-limit";
import {
  accessCookieName,
  burnPasswordComparison,
  mintAccessGrant,
  verifySpacePassword,
} from "@/lib/space-access";

const INVALID = { error: "Incorrect password" };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const [{ name }, headerList] = await Promise.all([params, headers()]);
  const normalizedName = name.toLowerCase();
  const ip = headerList.get("x-forwarded-for") ?? "anonymous";

  const [perIp, perSpace] = await Promise.all([
    passwordAttemptRateLimiter.limit(`${ip}:${normalizedName}`),
    spacePasswordRateLimiter.limit(normalizedName),
  ]);
  if (!perIp.success || !perSpace.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = verifySpaceAccessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  const presented =
    "auth_token" in parsed.data ? parsed.data.auth_token : parsed.data.password;
  const presentedIsToken = "auth_token" in parsed.data;

  const admin = createAdminClient();
  const { data: space } = await admin
    .from("spaces")
    .select(
      "id, name, is_private, password_hash, expires_at, encryption_version, wrapped_dek"
    )
    .eq("name", normalizedName)
    .single();

  if (!space || !space.is_private || !space.password_hash) {
    await burnPasswordComparison(presented);
    return NextResponse.json(INVALID, { status: 401 });
  }

  if (presentedIsToken !== Boolean(space.encryption_version)) {
    await burnPasswordComparison(presented);
    return NextResponse.json(INVALID, { status: 401 });
  }

  if (new Date(space.expires_at) < new Date()) {
    await burnPasswordComparison(presented);
    return NextResponse.json({ error: "Space expired" }, { status: 404 });
  }

  const matches = await verifySpacePassword(presented, space.password_hash);
  if (!matches) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  const grant = mintAccessGrant(space);
  if (!grant) {
    return NextResponse.json({ error: "Space expired" }, { status: 404 });
  }

  const response = NextResponse.json({
    granted: true,
    wrapped_dek: space.wrapped_dek,
  });
  response.cookies.set(accessCookieName(space.name), grant.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: grant.maxAge,
  });

  return response;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  const response = NextResponse.json({ granted: false });
  response.cookies.set(accessCookieName(name), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
