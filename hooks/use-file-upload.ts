"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { friendlyUploadError } from "@/lib/upload-errors";

const MAX_CONCURRENT = 3;
const UPLOAD_TIMEOUT_MS = 60_000;
const METADATA_TIMEOUT_MS = 30_000;

export interface UploadItem {
  id: string;
  file: File;
}

export interface UploadResult {
  id: string;
  filename: string;
  success: boolean;
  error?: string;
}

export interface StorageUploadResult {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  success: boolean;
  error?: string;
}

interface UploadProgress {
  completed: number;
  total: number;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error("Request timed out") as Error & { name: string };
      err.name = "TimeoutError";
      reject(err);
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function uploadFilesToStorage(
  items: UploadItem[],
  spaceName: string,
  onProgress?: (completed: number, total: number) => void
): Promise<StorageUploadResult[]> {
  const supabase = createClient();
  const results: StorageUploadResult[] = [];
  const total = items.length;

  onProgress?.(0, total);

  for (const { id, file } of items) {
    const path = `${spaceName}/${crypto.randomUUID()}-${file.name}`;
    let uploadError: unknown;
    try {
      const { error } = await withTimeout(
        supabase.storage.from("space-files").upload(path, file),
        UPLOAD_TIMEOUT_MS
      );
      uploadError = error;
    } catch (err) {
      uploadError = err;
    }

    if (uploadError) {
      results.push({
        id,
        filename: file.name,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
        success: false,
        error: friendlyUploadError(uploadError),
      });
    } else {
      results.push({
        id,
        filename: file.name,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
        success: true,
      });
    }

    onProgress?.(results.length, total);
  }

  return results;
}

export function useBatchFileUpload() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<UploadProgress>({ completed: 0, total: 0 });

  const mutation = useMutation({
    mutationFn: async ({
      items,
      spaceName,
      spaceId,
    }: {
      items: UploadItem[];
      spaceName: string;
      spaceId: string;
    }) => {
      const results: UploadResult[] = [];
      setProgress({ completed: 0, total: items.length });

      const queue = [...items];
      const inFlight: Promise<void>[] = [];

      async function uploadOne({ id, file }: UploadItem) {
        const path = `${spaceName}/${crypto.randomUUID()}-${file.name}`;
        let uploadError: unknown;
        try {
          const { error } = await withTimeout(
            supabase.storage.from("space-files").upload(path, file),
            UPLOAD_TIMEOUT_MS
          );
          uploadError = error;
        } catch (err) {
          uploadError = err;
        }

        if (uploadError) {
          results.push({
            id,
            filename: file.name,
            success: false,
            error: friendlyUploadError(uploadError),
          });
          setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
          return;
        }

        try {
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
            signal: AbortSignal.timeout(METADATA_TIMEOUT_MS),
          });

          if (!res.ok) {
            let serverMessage = "";
            try {
              const errorData = await res.json();
              serverMessage = errorData?.error ?? "";
            } catch {
              serverMessage = "";
            }
            results.push({
              id,
              filename: file.name,
              success: false,
              error: friendlyUploadError({ message: serverMessage, status: res.status }),
            });
            const { error: removeError } = await supabase.storage
              .from("space-files")
              .remove([path]);
            if (removeError) {
              console.error("Failed to roll back orphaned upload", removeError);
            }
          } else {
            results.push({ id, filename: file.name, success: true });
          }
        } catch (err) {
          results.push({
            id,
            filename: file.name,
            success: false,
            error: friendlyUploadError(err),
          });
          const { error: removeError } = await supabase.storage
            .from("space-files")
            .remove([path]);
          if (removeError) {
            console.error("Failed to roll back orphaned upload", removeError);
          }
        }

        setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
      }

      async function processQueue() {
        while (queue.length > 0) {
          const item = queue.shift()!;
          const task = uploadOne(item);
          inFlight.push(task);

          if (inFlight.length >= MAX_CONCURRENT) {
            await Promise.race(inFlight);
            const settled = await Promise.allSettled(inFlight);
            const stillPending: Promise<void>[] = [];
            for (let i = 0; i < inFlight.length; i++) {
              if (settled[i].status !== "fulfilled" && settled[i].status !== "rejected") {
                stillPending.push(inFlight[i]);
              }
            }
            inFlight.length = 0;
            inFlight.push(...stillPending);
          }
        }
        await Promise.all(inFlight);
      }

      await processQueue();
      return results;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["files", variables.spaceName],
      });
    },
  });

  const reset = useCallback(() => {
    setProgress({ completed: 0, total: 0 });
  }, []);

  return { ...mutation, progress, resetProgress: reset };
}

export function useSpaceFiles(spaceName: string) {
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
    }),
  };
}
