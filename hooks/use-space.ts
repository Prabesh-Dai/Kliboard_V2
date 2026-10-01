"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addAnonClaim } from "@/lib/anon-claims";
import {
  decryptText,
  deriveSecrets,
  encryptText,
  unwrapDek,
} from "@/lib/crypto/space-crypto";
import {
  forgetSpaceKey,
  getKeySync,
  hydrateKey,
  rememberKey,
} from "@/lib/crypto/key-session";
import type { EncryptionEnvelope } from "@/lib/schemas/space.schema";

interface Space {
  id: string;
  name: string;
  content: string;
  is_locked: boolean;
  is_private: boolean;
  duration: number;
  expires_at: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
  encryption_version?: number | null;
  kdf_salt?: string | null;
  kdf_iterations?: number | null;
  wrapped_dek?: string | null;
}

export interface SpaceEncryptionParams {
  version: number;
  kdf_salt: string;
  kdf_iterations: number;
  wrapped_dek?: string | null;
}

export type SpaceError = Error & {
  status?: number;
  requiresPassword?: boolean;
  encryption?: SpaceEncryptionParams;
};

function lockedError(
  message: string,
  encryption?: SpaceEncryptionParams
): SpaceError {
  const error = new Error(message) as SpaceError;
  error.status = 403;
  error.requiresPassword = true;
  error.encryption = encryption;
  return error;
}

function paramsFromSpace(space: Space): SpaceEncryptionParams | undefined {
  if (!space.encryption_version || !space.kdf_salt || !space.kdf_iterations) {
    return undefined;
  }
  return {
    version: space.encryption_version,
    kdf_salt: space.kdf_salt,
    kdf_iterations: space.kdf_iterations,
    wrapped_dek: space.wrapped_dek,
  };
}

async function fetchSpace(name: string): Promise<Space> {
  const res = await fetch(`/api/spaces/${name}`);
  if (!res.ok) {
    const data = await res.json();
    const error = new Error(data.error ?? res.statusText) as SpaceError;
    error.status = res.status;
    error.requiresPassword = Boolean(data.requires_password);
    error.encryption = data.encryption ?? undefined;
    throw error;
  }

  const space = (await res.json()) as Space;
  if (!space.encryption_version || !space.content) return space;

  const dek = getKeySync(name) ?? (await hydrateKey(name));
  if (!dek) {
    throw lockedError("Password required", paramsFromSpace(space));
  }

  try {
    return { ...space, content: await decryptText(dek, space.content) };
  } catch (err) {
    console.error("Could not decrypt space content", err);
    await forgetSpaceKey(name);
    throw lockedError("Could not decrypt this space", paramsFromSpace(space));
  }
}

export function useSpace(name: string) {
  return useQuery({
    queryKey: ["space", name],
    queryFn: () => fetchSpace(name),
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const err = error as SpaceError;
      if (
        err.status === 401 ||
        err.status === 403 ||
        err.status === 404 ||
        err.status === 429
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useUnlockSpace(name: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      password,
      encryption,
    }: {
      password: string;
      encryption?: SpaceEncryptionParams;
    }) => {
      if (!encryption) {
        const res = await fetch(`/api/spaces/${name}/access`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error ?? res.statusText);
        }
        return { granted: true };
      }

      const { kek, authToken } = await deriveSecrets(password, {
        salt: encryption.kdf_salt,
        iterations: encryption.kdf_iterations,
      });

      let wrapped = encryption.wrapped_dek ?? null;
      if (!wrapped) {
        const res = await fetch(`/api/spaces/${name}/access`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auth_token: authToken }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error ?? res.statusText);
        }
        wrapped = ((await res.json()) as { wrapped_dek?: string }).wrapped_dek ?? null;
      }

      if (!wrapped) {
        throw new Error("This space is missing its key");
      }

      let dek: CryptoKey;
      try {
        dek = await unwrapDek(wrapped, kek);
      } catch {
        throw new Error("Incorrect password");
      }

      await rememberKey(name, dek);
      return { granted: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", name] });
      queryClient.invalidateQueries({ queryKey: ["files", name] });
    },
  });
}

export interface VisibilityInput {
  is_private: boolean;
  encryption?: EncryptionEnvelope;
  content?: string;
  files?: {
    id: string;
    storage_path: string;
    filename: string;
    mime_type: string;
    size_bytes: number;
  }[];
}

export function useSetSpaceVisibility(name: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: VisibilityInput) => {
      const res = await fetch(`/api/spaces/${name}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error ?? res.statusText);
      }
      return res.json() as Promise<Space>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", name] });
      queryClient.invalidateQueries({ queryKey: ["files", name] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-spaces"] });
      queryClient.invalidateQueries({ queryKey: ["recent-spaces"] });
    },
  });
}

export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      content?: string;
      duration?: number;
      files?: {
        filename: string;
        storage_path: string;
        mime_type: string;
        size_bytes: number;
        encryption_version?: number;
      }[];
      is_private?: boolean;
      encryption?: EncryptionEnvelope;
    }) => {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        const errorData = await res.json();
        const err = new Error(errorData.error ?? res.statusText) as Error & {
          status: number;
        };
        err.status = res.status;
        throw err;
      }
      return res.json() as Promise<Space & { claim_token?: string }>;
    },
    onSuccess: (data) => {
      if (data.claim_token && data.name) {
        addAnonClaim(data.name, data.claim_token);
      }
      queryClient.invalidateQueries({ queryKey: ["recent-spaces"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-spaces"] });
    },
  });
}

export function useUpdateSpace(name: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content?: string; duration?: number }) => {
      const cached = queryClient.getQueryData<Space>(["space", name]);
      const encrypted = Boolean(cached?.encryption_version);
      let payload = data;

      if (encrypted && data.content !== undefined) {
        const dek = getKeySync(name);
        if (!dek) {
          throw new Error("Unlock this space before saving");
        }
        payload = { ...data, content: await encryptText(dek, data.content) };
      }

      const res = await fetch(`/api/spaces/${name}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error ?? res.statusText);
      }

      const saved = (await res.json()) as Space;
      if (!encrypted) return saved;

      const dek = getKeySync(name);
      let plaintext = data.content;
      if (plaintext === undefined) {
        plaintext =
          dek && saved.content
            ? await decryptText(dek, saved.content)
            : (cached?.content ?? "");
      }
      return { ...saved, content: plaintext };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["space", name], data);
      queryClient.invalidateQueries({ queryKey: ["dashboard-spaces"] });
      queryClient.invalidateQueries({ queryKey: ["recent-spaces"] });
    },
  });
}

export function useToggleLock(name: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/spaces/${name}/lock`, { method: "PATCH" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error ?? res.statusText);
      }
      return res.json() as Promise<Space>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Space>(["space", name], (prev) =>
        prev?.encryption_version ? { ...data, content: prev.content } : data
      );
    },
  });
}

export function useDeleteSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/spaces/${name}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error ?? res.statusText);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-spaces"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-spaces"] });
    },
  });
}

type RecentSpace = Space & { file_count: number };

export function useRecentSpaces() {
  return useQuery({
    queryKey: ["recent-spaces"],
    queryFn: async () => {
      const res = await fetch("/api/spaces/recent");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error ?? res.statusText);
      }
      return res.json() as Promise<RecentSpace[]>;
    },
  });
}

export function useAllRecentSpaces(enabled: boolean) {
  return useQuery({
    queryKey: ["recent-spaces", "all"],
    queryFn: async () => {
      const res = await fetch("/api/spaces/recent?limit=100");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error ?? res.statusText);
      }
      return res.json() as Promise<RecentSpace[]>;
    },
    enabled,
  });
}
