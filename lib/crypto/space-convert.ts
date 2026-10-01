"use client";

import { ENCRYPTED_MIME_TYPE } from "@/lib/constants";
import {
  decryptFileMetadata,
  encryptFileForUpload,
  fetchAndDecryptFile,
  uploadViaSignedSlot,
} from "@/lib/crypto/space-files";

export interface StoredFile {
  id: string;
  filename: string;
  mime_type: string;
  storage_path: string;
  size_bytes: number;
  signed_url: string | null;
  encryption_version?: number | null;
}

export interface FileRekey {
  id: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
}

type ProgressFn = (completed: number, total: number) => void;

async function download(file: StoredFile): Promise<Blob> {
  if (!file.signed_url) {
    throw new Error("This file is no longer available");
  }
  const res = await fetch(file.signed_url);
  if (!res.ok) {
    throw new Error("Could not download an existing file");
  }
  return res.blob();
}

export async function encryptExistingFiles(
  spaceName: string,
  files: StoredFile[],
  dek: CryptoKey,
  onProgress?: ProgressFn
): Promise<FileRekey[]> {
  const rekeys: FileRekey[] = [];
  onProgress?.(0, files.length);

  for (const file of files) {
    const blob = await download(file);
    const asFile = new File([blob], file.filename, {
      type: file.mime_type || ENCRYPTED_MIME_TYPE,
    });
    const encrypted = await encryptFileForUpload(dek, asFile);
    const path = await uploadViaSignedSlot(spaceName, encrypted.blob);

    rekeys.push({
      id: file.id,
      storage_path: path,
      filename: encrypted.filename,
      mime_type: encrypted.mime_type,
      size_bytes: encrypted.size_bytes,
    });
    onProgress?.(rekeys.length, files.length);
  }

  return rekeys;
}

export async function decryptExistingFiles(
  spaceName: string,
  files: StoredFile[],
  dek: CryptoKey,
  onProgress?: ProgressFn
): Promise<FileRekey[]> {
  const rekeys: FileRekey[] = [];
  onProgress?.(0, files.length);

  for (const file of files) {
    if (!file.signed_url) {
      throw new Error("This file is no longer available");
    }
    const [plainBytes, meta] = await Promise.all([
      fetchAndDecryptFile(dek, file.signed_url),
      decryptFileMetadata(dek, file),
    ]);
    const blob = new Blob([plainBytes], { type: meta.mimeType });
    const path = await uploadViaSignedSlot(spaceName, blob, meta.mimeType);

    rekeys.push({
      id: file.id,
      storage_path: path,
      filename: meta.filename,
      mime_type: meta.mimeType,
      size_bytes: blob.size,
    });
    onProgress?.(rekeys.length, files.length);
  }

  return rekeys;
}
