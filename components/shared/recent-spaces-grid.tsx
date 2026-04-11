"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentSpaces } from "@/hooks/use-space";
import { Clock, FileText } from "lucide-react";

export function RecentSpacesGrid() {
  const { data: spaces, isLoading, error } = useRecentSpaces();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-sm text-destructive">
        Failed to load recent spaces
      </p>
    );
  }

  if (!spaces?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">No spaces yet. Create one above!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {spaces.map((space) => (
        <Link key={space.id} href={`/space/${space.name}`}>
          <Card className="transition-colors hover:bg-accent/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                {space.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-2 text-sm text-muted-foreground font-mono">
                {space.content}
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Expires{" "}
                {formatDistanceToNow(new Date(space.expires_at), {
                  addSuffix: true,
                })}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
