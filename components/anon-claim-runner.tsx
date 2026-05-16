"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { getAnonClaims, removeAnonClaim } from "@/lib/anon-claims";

interface ClaimedSpace {
  id: string;
  name: string;
  content: string;
  is_locked: boolean;
  duration: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

async function claimOne(spaceName: string, token: string): Promise<ClaimedSpace | null> {
  try {
    const res = await fetch(`/api/spaces/${spaceName}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) return (await res.json()) as ClaimedSpace;
    const body = await res.text().catch(() => "");
    console.warn(`[anon-claim] ${spaceName} failed: HTTP ${res.status}`, body);
    if (res.status === 404 || res.status === 409 || res.status === 403) {
      removeAnonClaim(spaceName);
    }
    return null;
  } catch (err) {
    console.warn("[anon-claim] request failed", err);
    return null;
  }
}

export function AnonClaimRunner() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user) {
      lastUserId.current = user?.id ?? null;
      return;
    }
    if (lastUserId.current === user.id) return;
    lastUserId.current = user.id;

    const pending = getAnonClaims();
    console.log(`[anon-claim] runner fired for user ${user.id} — ${pending.length} pending claim(s)`, pending.map((c) => c.spaceName));
    if (pending.length === 0) return;

    (async () => {
      const results = await Promise.all(
        pending.map((c) => claimOne(c.spaceName, c.token))
      );

      const successful: ClaimedSpace[] = [];
      results.forEach((space, idx) => {
        if (space) {
          successful.push(space);
          removeAnonClaim(pending[idx].spaceName);
        }
      });

      if (successful.length > 0) {
        toast.success(
          successful.length === 1
            ? "Claimed 1 space"
            : `Claimed ${successful.length} spaces`
        );

        queryClient.setQueryData<ClaimedSpace[]>(
          ["dashboard-spaces", user.id],
          (old) => {
            const existing = old ?? [];
            const merged = [
              ...successful.filter((s) => !existing.some((e) => e.id === s.id)),
              ...existing,
            ];
            return merged.sort(
              (a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
          }
        );

        queryClient.invalidateQueries({ queryKey: ["dashboard-spaces"] });
        queryClient.invalidateQueries({ queryKey: ["recent-spaces"] });
        pending.forEach((c) => {
          queryClient.invalidateQueries({ queryKey: ["space", c.spaceName] });
        });
      }
    })();
  }, [user, loading, queryClient]);

  return null;
}
