"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/constants";

export function useFileUpload(spaceName: string, spaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed`);
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error("File too large (max 10MB)");
      }

      setProgress(0);
      const path = `${spaceName}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("space-files")
        .upload(path, file);

      if (uploadError) throw uploadError;
      setProgress(50);

      const res = await fetch(`/api/spaces/${spaceName}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          storage_path: path,
          mime_type: file.type,
          size_bytes: file.size,
          space_id: spaceId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error ?? "Failed to save file metadata");
      }

      setProgress(100);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", spaceName] });
    },
    onSettled: () => {
      setProgress(0);
    },
  });

  return { uploadFile: mutation.mutateAsync, progress, ...mutation };
}

export function useSpaceFiles(spaceName: string) {
  const queryClient = useQueryClient();

  return {
    deleteFile: useMutation({
      mutationFn: async (fileId: string) => {
        const res = await fetch(`/api/spaces/${spaceName}/files/${fileId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error ?? "Failed to delete file");
        }
        return res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["files", spaceName] });
      },
    }),
  };
}
