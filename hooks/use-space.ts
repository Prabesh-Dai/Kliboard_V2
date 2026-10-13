"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addAnonClaim } from "@/lib/anon-claims";

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
}

export type SpaceError = Error & {
  status?: number;
  requiresPassword?: boolean;
};

export async function toSpaceError(res: Response, fallback: string): Promise<SpaceError> {
  const data = await res.json().catch((parseError: unknown) => {
    console.error("Non-JSON error response", res.status, parseError);
    return {};
  });
  const error = new Error(
    typeof data.error === "string" && data.error ? data.error : fallback
  ) as SpaceError;
  error.status = res.status;
  error.requiresPassword = Boolean(data.requires_password);
  return error;
}

export function isAccessLost(err: unknown): boolean {
  return Boolean((err as SpaceError | null)?.requiresPassword);
}

async function fetchSpace(name: string): Promise<Space> {
  const res = await fetch(`/api/spaces/${name}`);
  if (!res.ok) throw await toSpaceError(res, "Couldn't load this space");
  return res.json();
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
    mutationFn: async (password: string) => {
      const res = await fetch(`/api/spaces/${name}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw await toSpaceError(res, "Couldn't open this space. Try again.");
      return res.json() as Promise<{ granted: boolean }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", name] });
      queryClient.invalidateQueries({ queryKey: ["files", name] });
    },
  });
}

export function useSetSpaceVisibility(name: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: { is_private: true; password: string } | { is_private: false }
    ) => {
      const res = await fetch(`/api/spaces/${name}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw await toSpaceError(res, "Couldn't update visibility");
      return res.json() as Promise<Space>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["space", name], data);
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
      files?: { filename: string; storage_path: string; mime_type: string; size_bytes: number }[];
      is_private?: boolean;
      password?: string;
    }) => {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw await toSpaceError(res, "Couldn't create this space");
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
      const res = await fetch(`/api/spaces/${name}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw await toSpaceError(res, "Couldn't save");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["space", name], data);
      queryClient.invalidateQueries({ queryKey: ["dashboard-spaces"] });
      queryClient.invalidateQueries({ queryKey: ["recent-spaces"] });
    },
    onError: (err) => {
      if (isAccessLost(err)) {
        queryClient.invalidateQueries({ queryKey: ["space", name] });
      }
    },
  });
}

export function useToggleLock(name: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/spaces/${name}/lock`, { method: "PATCH" });
      if (!res.ok) throw await toSpaceError(res, "Couldn't change the lock");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["space", name], data);
    },
  });
}

export function useDeleteSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/spaces/${name}`, { method: "DELETE" });
      if (!res.ok) throw await toSpaceError(res, "Couldn't delete this space");
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
      if (!res.ok) throw await toSpaceError(res, "Couldn't load recent spaces");
      return res.json() as Promise<RecentSpace[]>;
    },
  });
}

export function useAllRecentSpaces(enabled: boolean) {
  return useQuery({
    queryKey: ["recent-spaces", "all"],
    queryFn: async () => {
      const res = await fetch("/api/spaces/recent?limit=100");
      if (!res.ok) throw await toSpaceError(res, "Couldn't load recent spaces");
      return res.json() as Promise<RecentSpace[]>;
    },
    enabled,
  });
}
