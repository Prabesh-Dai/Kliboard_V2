"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpaceFiles } from "@/hooks/use-file-upload";
import { createClient } from "@/lib/supabase/client";
import { Download, Trash2, FileIcon } from "lucide-react";

interface FileListProps {
  spaceName: string;
  isOwner: boolean;
}

interface FileRecord {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({ spaceName, isOwner }: FileListProps) {
  const { deleteFile } = useSpaceFiles(spaceName);

  const { data: files, isLoading } = useQuery({
    queryKey: ["files", spaceName],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${spaceName}/files`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error ?? "Failed to load files");
      }
      return res.json() as Promise<FileRecord[]>;
    },
  });

  async function handleDownload(file: FileRecord) {
    const supabase = createClient();
    const { data } = supabase.storage
      .from("space-files")
      .getPublicUrl(file.storage_path);

    window.open(data.publicUrl, "_blank");
  }

  async function handleDelete(file: FileRecord) {
    try {
      await deleteFile.mutateAsync(file.id);
      toast.success(`${file.filename} deleted`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete file";
      toast.error(message);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!files?.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No files attached
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.filename}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size_bytes)} &middot;{" "}
                {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDownload(file)}
            >
              <Download className="h-4 w-4" />
            </Button>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(file)}
                disabled={deleteFile.isPending}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
