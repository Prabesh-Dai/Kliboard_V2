"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useDeleteSpace } from "@/hooks/use-space";
import { createClient } from "@/lib/supabase/client";
import { Trash2, ExternalLink, Clock, Lock, Globe } from "lucide-react";

interface UserSpace {
  id: string;
  name: string;
  content: string;
  is_private: boolean;
  duration: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
  password_hash: string | null;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const deleteSpace = useDeleteSpace();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const { data: spaces, isLoading } = useQuery({
    queryKey: ["dashboard-spaces", user?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("spaces")
        .select("*")
        .eq("owner_id", user!.id)
        .order("updated_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data as UserSpace[];
    },
    enabled: Boolean(user),
  });

  async function handleDelete(name: string) {
    try {
      await deleteSpace.mutateAsync(name);
      toast.success("Space deleted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete space";
      toast.error(message);
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Spaces</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !spaces?.length ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">You haven&apos;t created any spaces yet.</p>
          <Button className="mt-4" render={<Link href="/" />}>
            Create a Space
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {spaces.map((space) => {
            const expired = new Date(space.expires_at) < new Date();
            return (
              <div
                key={space.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/space/${space.name}`}
                      className="font-medium hover:underline"
                    >
                      {space.name}
                    </Link>
                    {space.is_private && (
                      <Badge variant="secondary">
                        <Lock className="mr-1 h-3 w-3" />
                        Private
                      </Badge>
                    )}
                    {!space.is_private && (
                      <Badge variant="outline">
                        <Globe className="mr-1 h-3 w-3" />
                        Public
                      </Badge>
                    )}
                    {expired && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground font-mono">
                    {space.content}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {expired
                      ? "Expired"
                      : `Expires ${formatDistanceToNow(new Date(space.expires_at), { addSuffix: true })}`}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-4">
                  <Button variant="ghost" size="icon" render={<Link href={`/space/${space.name}`} />}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(space.name)}
                    disabled={deleteSpace.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
