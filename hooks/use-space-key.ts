"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getKeySync,
  hydrateKey,
  subscribeToKeys,
} from "@/lib/crypto/key-session";

export function useSpaceKey(spaceName: string): CryptoKey | null {
  const key = useSyncExternalStore(
    subscribeToKeys,
    () => getKeySync(spaceName),
    () => null
  );

  useEffect(() => {
    if (key) return;
    hydrateKey(spaceName).catch((err) => {
      console.error("Failed to restore space key", err);
    });
  }, [spaceName, key]);

  return key;
}
