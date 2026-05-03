"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { useSpace, useUpdateSpace, useToggleLock, useDeleteSpace } from "@/hooks/use-space";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DeletionCountdown } from "@/components/space/deletion-countdown";
import { ADMIN_DURATION_OPTIONS } from "@/lib/constants";
import {
  fadeUp,
  fadeIn,
  staggerContainer,
  screenFade,
  baseTransition,
  DURATION,
} from "@/lib/animations";
import {
  ArrowLeft,
  Shield,
  Lock,
  LockOpen,
  ExternalLink,
  Trash2,
  Loader2,
  Save,
} from "lucide-react";

function formatCountdown(expiresAt: string): string {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return "expired";
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${String(hours).padStart(2, "0")}h`;
  if (hours > 0) return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  return `${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function useCountdown(expiresAt?: string) {
  const [text, setText] = useState(() =>
    expiresAt ? formatCountdown(expiresAt) : ""
  );
  useEffect(() => {
    if (!expiresAt) return;
    setText(formatCountdown(expiresAt));
    const id = setInterval(() => setText(formatCountdown(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return text;
}

export default function AdminSpacePage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["admin-status"],
    queryFn: async () => {
      const res = await fetch("/api/auth/admin");
      const data = await res.json();
      return data.isAdmin as boolean;
    },
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });

  const { data: space, isLoading, error, refetch } = useSpace(name);
  const updateSpace = useUpdateSpace(name);
  const toggleLock = useToggleLock(name);
  const deleteSpace = useDeleteSpace();

  const [content, setContent] = useState("");
  const [duration, setDuration] = useState(5);
  const [prevSpaceId, setPrevSpaceId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const countdown = useCountdown(space?.expires_at);

  useEffect(() => {
    if (!authLoading && !adminLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, authLoading, isAdmin, adminLoading, router]);

  if (space && prevSpaceId !== space.id) {
    setPrevSpaceId(space.id);
    setContent(space.content);
    setDuration(space.duration);
  }

  const hasChanges = Boolean(
    space && (content !== space.content || duration !== space.duration)
  );
  const isSaving = updateSpace.isPending;

  async function handleSave() {
    if (!space || !hasChanges) return;
    const updates: { content?: string; duration?: number } = {};
    if (content !== space.content) updates.content = content;
    if (duration !== space.duration) updates.duration = duration;
    try {
      await updateSpace.mutateAsync(updates);
      toast.success("Space updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    }
  }

  async function handleToggleLock() {
    try {
      await toggleLock.mutateAsync();
      toast.success(space?.is_locked ? "Space unlocked" : "Space locked");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to toggle lock";
      toast.error(msg);
    }
  }

  async function handleDelete() {
    try {
      await deleteSpace.mutateAsync(name);
      toast.success("Space deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-spaces"] });
      router.push("/admin");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    } finally {
      setDeleteOpen(false);
    }
  }

  if (authLoading || adminLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            variants={screenFade}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.div variants={fadeUp} transition={baseTransition} className="mb-6">
                <Skeleton className="h-5 w-32" />
              </motion.div>
              <motion.div variants={fadeUp} transition={baseTransition} className="mb-8 flex items-center justify-between">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-14 w-40 rounded-lg" />
              </motion.div>
              <motion.div variants={fadeUp} transition={baseTransition}>
                <Skeleton className="h-64 rounded-lg" />
              </motion.div>
            </motion.div>
          </motion.div>
        ) : error || !space ? (
          <motion.div
            key="error"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={baseTransition}
            className="py-16 text-center"
          >
            <p className="text-sm text-muted-foreground">Space not found</p>
            <Link
              href="/admin"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Back to admin
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={screenFade}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.div variants={fadeUp} transition={baseTransition} className="mb-6 flex items-center gap-3">
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Admin
                </Link>
                <span className="text-muted-foreground/30">/</span>
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-primary" />
                  <span className="text-xs text-muted-foreground">Editing as admin</span>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} transition={baseTransition} className="mb-8 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <button
                      onClick={handleToggleLock}
                      disabled={toggleLock.isPending}
                      className="flex cursor-pointer items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {space.is_locked ? <Lock className="h-2.5 w-2.5" /> : <LockOpen className="h-2.5 w-2.5" />}
                      {space.is_locked ? "Locked" : "Unlocked"}
                    </button>
                    <span className="text-muted-foreground/20">·</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {space.owner_id ? "owned" : "anonymous"}
                    </span>
                  </div>
                  <h1 className="font-heading text-3xl font-medium tracking-tight">
                    {decodeURIComponent(name)}
                  </h1>
                </div>
                <div className="flex shrink-0 items-stretch overflow-hidden rounded-lg bg-surface-container-low">
                  <DeletionCountdown
                    countdown={countdown}
                    isSaved={true}
                    duration={duration}
                    onDurationChange={setDuration}
                    isAdmin
                  />
                </div>
              </motion.div>

              <motion.div variants={fadeUp} transition={baseTransition} className="mb-6">
                <div className="rounded-lg bg-surface-container-low p-6 ring-1 ring-ghost-border">
                  <Textarea
                    ref={textareaRef}
                    className="min-h-48 max-h-[50dvh] resize-none border-0 bg-transparent px-0 py-0 font-heading text-sm shadow-none field-sizing-content overflow-y-auto break-all placeholder:text-muted-foreground focus-visible:ring-0"
                    placeholder="Space content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </motion.div>

              <motion.div variants={fadeUp} transition={baseTransition} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/space/${name}`}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View as user
                  </Link>
                  <button
                    onClick={() => setDeleteOpen(true)}
                    className="flex cursor-pointer items-center gap-1.5 text-xs text-destructive transition-colors hover:text-destructive/80"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete space
                  </button>
                </div>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="flex h-10 cursor-pointer items-center gap-2 rounded-sm bg-linear-to-br from-primary to-primary-container px-6 text-primary-foreground shadow-md hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium uppercase tracking-widest">
                    {isSaving ? "Saving..." : "Save"}
                  </span>
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete space</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{decodeURIComponent(name)}&rdquo; and all its files. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSpace.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSpace.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSpace.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleteSpace.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
