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
      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:border-muted-foreground/50"
    >
      <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {isPending ? "Uploading..." : "Drop files here or click to upload"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Images, PDFs, text files up to 10MB
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
