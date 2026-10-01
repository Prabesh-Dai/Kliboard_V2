import { SPACE_ACCESS_TTL_SECONDS } from "@/lib/constants";
import { cacheKey, forgetKey, getCachedKey } from "@/lib/crypto/key-store";

const keys = new Map<string, CryptoKey>();
const listeners = new Set<() => void>();
const hydrating = new Map<string, Promise<CryptoKey | null>>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToKeys(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getKeySync(spaceName: string): CryptoKey | null {
  return keys.get(spaceName.toLowerCase()) ?? null;
}

export async function rememberKey(
  spaceName: string,
  dek: CryptoKey
): Promise<void> {
  keys.set(spaceName.toLowerCase(), dek);
  emit();
  await cacheKey(spaceName, dek, SPACE_ACCESS_TTL_SECONDS);
}

export async function forgetSpaceKey(spaceName: string): Promise<void> {
  keys.delete(spaceName.toLowerCase());
  emit();
  await forgetKey(spaceName);
}

export function hydrateKey(spaceName: string): Promise<CryptoKey | null> {
  const normalized = spaceName.toLowerCase();
  const existing = keys.get(normalized);
  if (existing) return Promise.resolve(existing);

  const inFlight = hydrating.get(normalized);
  if (inFlight) return inFlight;

  const pending = getCachedKey(normalized)
    .then((key) => {
      if (key) {
        keys.set(normalized, key);
        emit();
      }
      return key;
    })
    .finally(() => {
      hydrating.delete(normalized);
    });

  hydrating.set(normalized, pending);
  return pending;
}
