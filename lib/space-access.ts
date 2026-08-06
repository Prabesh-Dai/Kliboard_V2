import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { SPACE_ACCESS_TTL_SECONDS } from "@/lib/constants";

const BCRYPT_ROUNDS = 10;

const DUMMY_HASH = "$2b$10$7NmvWlcZ2Nyhw5pztassG.wbG3fENd1UR3cCKZO1mW/2T3taOkhy6";

function getSecret(): string {
  const secret = process.env.SPACE_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SPACE_ACCESS_SECRET is missing or too short (needs >= 32 characters)"
    );
  }
  return secret;
}

export function hashSpacePassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifySpacePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function burnPasswordComparison(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_HASH);
}

export function accessCookieName(spaceName: string): string {
  return `kb_access_${spaceName.toLowerCase()}`;
}

interface GrantSubject {
  id: string;
  password_hash: string | null;
  expires_at: string;
}

function sign(spaceId: string, exp: number, passwordHash: string): string {
  return createHmac("sha256", getSecret())
    .update(`${spaceId}:${exp}:${passwordHash}`)
    .digest("base64url");
}

export function mintAccessGrant(space: GrantSubject): {
  value: string;
  maxAge: number;
} | null {
  if (!space.password_hash) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const spaceExpirySeconds = Math.floor(
    new Date(space.expires_at).getTime() / 1000
  );
  const maxAge = Math.min(
    SPACE_ACCESS_TTL_SECONDS,
    spaceExpirySeconds - nowSeconds
  );

  if (maxAge <= 0) return null;

  const exp = nowSeconds + maxAge;
  return { value: `${exp}.${sign(space.id, exp, space.password_hash)}`, maxAge };
}

export function verifyAccessGrant(
  cookieValue: string | undefined,
  space: GrantSubject
): boolean {
  if (!cookieValue || !space.password_hash) return false;

  const separator = cookieValue.indexOf(".");
  if (separator < 1) return false;

  const exp = Number(cookieValue.slice(0, separator));
  if (!Number.isSafeInteger(exp) || exp <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const presented = Buffer.from(cookieValue.slice(separator + 1));
  const expected = Buffer.from(sign(space.id, exp, space.password_hash));
  if (presented.length !== expected.length) return false;

  return timingSafeEqual(presented, expected);
}
