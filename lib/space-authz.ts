import "server-only";
import { cookies } from "next/headers";
import { accessCookieName, verifyAccessGrant } from "@/lib/space-access";

export interface AccessSubject {
  id: string;
  name: string;
  owner_id: string | null;
  is_private: boolean;
  password_hash: string | null;
  expires_at: string;
  encryption_version?: number | null;
}

export const SPACE_SECURITY_COLUMNS =
  "id, name, owner_id, is_private, password_hash, expires_at, is_locked, encryption_version";

export async function hasSpaceAccess(
  space: AccessSubject,
  userId: string | null,
  userIsAdmin = false
): Promise<boolean> {
  if (!space.is_private) return true;
  if (userIsAdmin) return true;
  if (userId && space.owner_id === userId) return true;

  const store = await cookies();
  return verifyAccessGrant(store.get(accessCookieName(space.name))?.value, space);
}
