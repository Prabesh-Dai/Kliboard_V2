"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpaceFiles } from "@/hooks/use-file-upload";
import { createClient } from "@/lib/supabase/client";
import { Download, Trash2, FileIcon, FileText, FileSpreadsheet } from "lucide-react";

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

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

function isImageFile(mimeType: string) {
  return IMAGE_TYPES.includes(mimeType);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileUrl(storagePath: string) {
  const supabase = createClient();
  const { data } = supabase.storage.from("space-files").getPublicUrl(storagePath);
  return data.publicUrl;
}

function getFileTypeIcon(mimeType: string) {
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv") return FileSpreadsheet;
  if (mimeType.includes("word") || mimeType === "text/markdown") return FileText;
  return FileIcon;
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

  function handleOpen(file: FileRecord) {
    window.open(getFileUrl(file.storage_path), "_blank");
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (!files?.length) {
    return (
      <p className="py-4 text-center font-mono text-sm text-muted-foreground">
        No files attached
      </p>
    );
  }

  const images = files.filter((f) => isImageFile(f.mime_type));
  const others = files.filter((f) => !isImageFile(f.mime_type));

  return (
    <div className="space-y-6">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((file) => (
            <div
              key={file.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-border/50 bg-card"
              onClick={() => handleOpen(file)}
            >
              <Image
                src={getFileUrl(file.storage_path)}
                alt={file.filename}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/40" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate font-mono text-xs text-white">{file.filename}</p>
                <p className="text-[10px] text-white/60">{formatFileSize(file.size_bytes)}</p>
              </div>
              {isOwner && (
                <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                    disabled={deleteFile.isPending}
                    className="bg-black/50 text-white hover:bg-black/70 hover:text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-2">
          {others.map((file) => {
            const Icon = getFileTypeIcon(file.mime_type);
            return (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:border-border"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size_bytes)} &middot;{" "}
                      {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(file)}>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
