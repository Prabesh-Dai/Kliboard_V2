"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AdminStats {
  totalSpaces: number;
  activeSpaces: number;
  expiredSpaces: number;
  unlimitedSpaces: number;
  totalFiles: number;
  totalStorageBytes: number;
  totalUsers: number;
}

interface AdminSpace {
  id: string;
  name: string;
  content: string;
  duration: number;
  expires_at: string;
  owner_id: string | null;
  owner_email: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminSpacesResponse {
  spaces: AdminSpace[];
  total: number;
  page: number;
  totalPages: number;
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  space_count: number;
  is_admin: boolean;
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });
}

export function useAdminSpaces(page: number, search: string) {
  return useQuery<AdminSpacesResponse>({
    queryKey: ["admin-spaces", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/spaces?${params}`);
      if (!res.ok) throw new Error("Failed to fetch spaces");
      return res.json();
    },
  });
}

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
}

export function usePurgeExpired() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/purge-expired", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to purge expired spaces");
      }
      return res.json() as Promise<{ deleted: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-spaces"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useAdminDeleteSpaces() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (spaceIds: string[]) => {
      const res = await fetch("/api/admin/spaces", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete spaces");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-spaces"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}
