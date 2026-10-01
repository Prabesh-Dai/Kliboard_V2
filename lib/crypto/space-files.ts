"use client";

import { createClient } from "@/lib/supabase/client";
import { ENCRYPTED_MIME_TYPE } from "@/lib/constants";
import {
  decryptBytes,
  decryptText,
  encryptBytes,
  encryptText,
} from "@/lib/crypto/space-crypto";

export interface EncryptedFilePayload {
  blob: Blob;
  filename: string;
  mime_type: string;
  size_bytes: number;
}

export async function encryptFileForUpload(
  dek: CryptoKey,
  file: File
): Promise<EncryptedFilePayload> {
  const [bytes, filename, mimeType] = await Promise.all([
    file.arrayBuffer().then((buffer) => encryptBytes(dek, buffer)),
    encryptText(dek, file.name),
    encryptText(dek, file.type || ENCRYPTED_MIME_TYPE),
  ]);

  const blob = new Blob([bytes as BlobPart], { type: ENCRYPTED_MIME_TYPE });
  return { blob, filename, mime_type: mimeType, size_bytes: blob.size };
}

export async function decryptFileMetadata(
  dek: CryptoKey,
  file: { filename: string; mime_type: string }
): Promise<{ filename: string; mimeType: string }> {
  const [filename, mimeType] = await Promise.all([
    decryptText(dek, file.filename),
    decryptText(dek, file.mime_type),
  ]);
  return { filename, mimeType };
}

export async function fetchAndDecryptFile(
  dek: CryptoKey,
  signedUrl: string
): Promise<ArrayBuffer> {
  const res = await fetch(signedUrl);
  if (!res.ok) {
    throw new Error("Could not download this file");
  }
  return decryptBytes(dek, await res.arrayBuffer());
}

export async function requestUploadSlot(
  spaceName: string
): Promise<{ path: string; token: string }> {
  const res = await fetch(`/api/spaces/${spaceName}/files/upload-url`, {
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Could not start the upload");
  }
  return res.json();
}

export async function uploadViaSignedSlot(
  spaceName: string,
  blob: Blob,
  contentType: string = ENCRYPTED_MIME_TYPE
): Promise<string> {
  const slot = await requestUploadSlot(spaceName);
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("space-files")
    .uploadToSignedUrl(slot.path, slot.token, blob, { contentType });

  if (error) throw error;
  return slot.path;
}
