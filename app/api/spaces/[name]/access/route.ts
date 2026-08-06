import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySpacePasswordSchema } from "@/lib/schemas/space.schema";
import { passwordAttemptRateLimiter } from "@/lib/rate-limit";
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

  const { success } = await passwordAttemptRateLimiter.limit(
    `${ip}:${normalizedName}`
  );
  if (!success) {
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

  const parsed = verifySpacePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: space } = await admin
    .from("spaces")
    .select("id, name, is_private, password_hash, expires_at")
    .eq("name", normalizedName)
    .single();

  if (!space || !space.is_private || !space.password_hash) {
    await burnPasswordComparison(parsed.data.password);
    return NextResponse.json(INVALID, { status: 401 });
  }

  if (new Date(space.expires_at) < new Date()) {
    await burnPasswordComparison(parsed.data.password);
    return NextResponse.json({ error: "Space expired" }, { status: 404 });
  }

  const matches = await verifySpacePassword(
    parsed.data.password,
    space.password_hash
  );
  if (!matches) {
    return NextResponse.json(INVALID, { status: 401 });
  }

  const grant = mintAccessGrant(space);
  if (!grant) {
    return NextResponse.json({ error: "Space expired" }, { status: 404 });
  }

  const response = NextResponse.json({ granted: true });
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
