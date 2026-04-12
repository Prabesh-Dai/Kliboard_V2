"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/constants";

interface FileUploadProps {
  spaceName: string;
  spaceId: string;
}

export function FileUpload({ spaceName, spaceId }: FileUploadProps) {
  const { uploadFile, isPending } = useFileUpload(spaceName, spaceId);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;

      for (const file of Array.from(files)) {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          toast.error(`${file.name}: File type not allowed`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error(`${file.name}: File too large (max 10MB)`);
          continue;
        }
        try {
          await uploadFile(file);
          toast.success(`${file.name} uploaded`);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          toast.error(`${file.name}: ${message}`);
        }
      }
    },
    [uploadFile]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => inputRef.current?.click()}
      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center transition-colors hover:bg-secondary"
    >
      <Upload className="mb-3 h-6 w-6 text-muted-foreground" />
      <p className="font-mono text-xs text-muted-foreground">
        {isPending ? "Uploading..." : "Drag and drop documents or images"}
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
