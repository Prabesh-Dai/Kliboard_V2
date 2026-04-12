"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentSpaces } from "@/hooks/use-space";
import { FolderOpen } from "lucide-react";

export function RecentSpacesGrid() {
  const { data: spaces, isLoading, error } = useRecentSpaces();

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || !spaces?.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {spaces.map((space) => (
        <Link key={space.id} href={`/space/${space.name}`}>
          <div className="flex items-center gap-3 rounded-lg bg-card p-4 transition-colors hover:bg-secondary">
            <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate font-mono text-sm">{space.name}</p>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">
                {formatDistanceToNow(new Date(space.updated_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
