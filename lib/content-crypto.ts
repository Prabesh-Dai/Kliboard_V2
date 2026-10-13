import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const ENCRYPTED_PATTERN = /^v1:([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]*)$/;

function loadKey(): Buffer | null {
  const raw = process.env.SPACE_CONTENT_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  return key.length === KEY_BYTES ? key : null;
}

function requireKey(): Buffer {
  const key = loadKey();
  if (!key) {
    throw new Error("SPACE_CONTENT_KEY is missing or not 32 bytes of base64");
  }
  return key;
}

export function isContentEncryptionConfigured(): boolean {
  return loadKey() !== null;
}

export function encryptContent(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, requireKey(), iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}.${tag.toString("base64url")}.${data.toString("base64url")}`;
}

export function decryptContent(stored: string): string {
  const match = ENCRYPTED_PATTERN.exec(stored);
  if (!match) return stored;

  const [, iv, tag, data] = match;
  const decipher = createDecipheriv(ALGORITHM, requireKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function storedContent(content: string, isPrivate: boolean): string {
  return isPrivate ? encryptContent(content) : content;
}

export function readableContent(space: { content: string; is_private: boolean }): string {
  return space.is_private ? decryptContent(space.content) : space.content;
}
