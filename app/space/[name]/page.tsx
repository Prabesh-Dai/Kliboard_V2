"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useSpace, useUpdateSpace } from "@/hooks/use-space";
import { useAuth } from "@/hooks/use-auth";
import { SpacePasswordDialog } from "@/components/space/space-password-dialog";
import { FileUpload } from "@/components/space/file-upload";
import { FileList } from "@/components/space/file-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DurationPicker } from "@/components/space/duration-picker";
import { AlertCircle, Lock, Shield } from "lucide-react";

interface FileRecord {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export default function SpacePage() {
  const { name } = useParams<{ name: string }>();
  const [accessPassword, setAccessPassword] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState("");
  const { user } = useAuth();
  const { data: space, isLoading, error } = useSpace(name, accessPassword);

  const [content, setContent] = useState("");
  const [duration, setDuration] = useState(5);
  const [spacePassword, setSpacePassword] = useState("");
  const [prevSpaceId, setPrevSpaceId] = useState<string | null>(null);

  const updateSpace = useUpdateSpace(name);

  const { data: files } = useQuery({
    queryKey: ["files", name],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${name}/files`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to load files");
      }
      return res.json() as Promise<FileRecord[]>;
    },
    enabled: Boolean(space),
  });

  if (space && prevSpaceId !== space.id) {
    setPrevSpaceId(space.id);
    setContent(space.content);
    setDuration(space.duration);
  }

  const hasFiles = Boolean(files?.length);
  const hasContent = Boolean(content.trim());
  const canSave = hasContent || hasFiles;
  const hasChanges = Boolean(
    space && (content !== space.content || duration !== space.duration || spacePassword)
  );

  const isPasswordProtected =
    error && (error as Error & { passwordProtected?: boolean }).passwordProtected;

  function handlePasswordSubmit(pw: string) {
    setPasswordError("");
    setAccessPassword(pw);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Copy failed";
      toast.error(msg);
    }
  }

  async function handleSave() {
    if (!canSave || !hasChanges) return;
    try {
      const updates: { content?: string; duration?: number; password?: string } = {};
      if (content !== space!.content) updates.content = content;
      if (duration !== space!.duration) updates.duration = duration;
      if (spacePassword) updates.password = spacePassword;

      await updateSpace.mutateAsync(updates);
      setSpacePassword("");
      toast.success("Space updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    }
  }

  if (isPasswordProtected && !space) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <SpacePasswordDialog
          open={true}
          onSubmit={handlePasswordSubmit}
          error={accessPassword ? "Invalid password" : passwordError}
          loading={isLoading}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="font-mono text-sm">Space not found</p>
      </div>
    );
  }

  const isOwner = Boolean(user && space.owner_id === user.id);
  const totalSize = files?.reduce((sum, f) => sum + f.size_bytes, 0) ?? 0;
  const totalSizeStr =
    totalSize < 1024
      ? `${totalSize} B`
      : totalSize < 1024 * 1024
        ? `${(totalSize / 1024).toFixed(1)} KB`
        : `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-end gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(space.expires_at), { addSuffix: true })}
        </span>
        {space.is_private && (
          <span className="flex items-center gap-1 rounded bg-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary-foreground">
            <Shield className="h-2.5 w-2.5" />
            secure
          </span>
        )}
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-mono text-sm">Add Note</p>
          {content && (
            <button
              onClick={handleCopy}
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              copy
            </button>
          )}
        </div>
        <Textarea
          className="min-h-[160px] resize-y bg-card font-mono text-sm"
          placeholder="Paste snippets, type notes, or drop files here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-[1fr_240px]">
        <FileUpload spaceName={space.name} spaceId={space.id} />

        <div className="space-y-4 rounded-lg bg-card p-4">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              storage info
            </p>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Size</span>
                <span>{totalSizeStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items Count</span>
                <span>{files?.length ?? 0} items</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <DurationPicker value={duration} onChange={setDuration} />
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                placeholder="password (optional)"
                className="h-8 pl-8 font-mono text-xs"
                value={spacePassword}
                onChange={(e) => setSpacePassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={!canSave || !hasChanges || updateSpace.isPending}
            className="w-full font-mono text-xs uppercase tracking-widest"
          >
            {updateSpace.isPending ? "saving..." : "update_space"}
          </Button>
        </div>
      </div>

      {hasFiles && (
        <div>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Stored Items
          </p>
          <FileList spaceName={space.name} isOwner={isOwner} />
        </div>
      )}
    </div>
  );
}
