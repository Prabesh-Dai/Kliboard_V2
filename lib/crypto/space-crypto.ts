import {
  PBKDF2_ITERATIONS,
  SPACE_ENCRYPTION_VERSION,
} from "@/lib/constants";

const SALT_BYTES = 16;
const IV_BYTES = 12;
const TEXT_ENVELOPE_PREFIX = "v1";
const BYTES_ENVELOPE_MAGIC = 0x01;

const KEK_INFO = "kliboard/kek/v1";
const AUTH_INFO = "kliboard/auth/v1";

export interface SpaceKdfParams {
  salt: string;
  iterations: number;
}

export interface DerivedSecrets {
  kek: CryptoKey;
  authToken: string;
}

function subtle(): SubtleCrypto {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error(
      "Encryption is unavailable in this browser. A secure (https) context is required."
    );
  }
  return crypto.subtle;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function generateKdfParams(): SpaceKdfParams {
  return {
    salt: toBase64Url(randomBytes(SALT_BYTES)),
    iterations: PBKDF2_ITERATIONS,
  };
}

export async function deriveSecrets(
  password: string,
  params: SpaceKdfParams
): Promise<DerivedSecrets> {
  const api = subtle();
  const passwordKey = await api.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const master = await api.deriveBits(
    {
      name: "PBKDF2",
      salt: fromBase64Url(params.salt) as BufferSource,
      iterations: params.iterations,
      hash: "SHA-256",
    },
    passwordKey,
    256
  );

  const hkdfKey = await api.importKey("raw", master, "HKDF", false, [
    "deriveBits",
  ]);

  const encoder = new TextEncoder();
  const [kekBits, authBits] = await Promise.all([
    api.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: new Uint8Array(0) as BufferSource,
        info: encoder.encode(KEK_INFO) as BufferSource,
      },
      hkdfKey,
      256
    ),
    api.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: new Uint8Array(0) as BufferSource,
        info: encoder.encode(AUTH_INFO) as BufferSource,
      },
      hkdfKey,
      256
    ),
  ]);

  const kek = await api.importKey("raw", kekBits, "AES-GCM", false, [
    "wrapKey",
    "unwrapKey",
  ]);

  return { kek, authToken: toBase64Url(new Uint8Array(authBits)) };
}

export function generateDek(): Promise<CryptoKey> {
  return subtle().generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function wrapDek(dek: CryptoKey, kek: CryptoKey): Promise<string> {
  const iv = randomBytes(IV_BYTES);
  const wrapped = await subtle().wrapKey("raw", dek, kek, {
    name: "AES-GCM",
    iv: iv as BufferSource,
  });
  return `${TEXT_ENVELOPE_PREFIX}.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(wrapped))}`;
}

export async function unwrapDek(
  envelope: string,
  kek: CryptoKey
): Promise<CryptoKey> {
  const parts = envelope.split(".");
  if (parts.length !== 3 || parts[0] !== TEXT_ENVELOPE_PREFIX) {
    throw new Error("Malformed key envelope");
  }
  return subtle().unwrapKey(
    "raw",
    fromBase64Url(parts[2]) as BufferSource,
    kek,
    { name: "AES-GCM", iv: fromBase64Url(parts[1]) as BufferSource },
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptText(
  dek: CryptoKey,
  plaintext: string
): Promise<string> {
  const iv = randomBytes(IV_BYTES);
  const ciphertext = await subtle().encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    dek,
    new TextEncoder().encode(plaintext)
  );
  return `${TEXT_ENVELOPE_PREFIX}.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptText(
  dek: CryptoKey,
  envelope: string
): Promise<string> {
  const parts = envelope.split(".");
  if (parts.length !== 3 || parts[0] !== TEXT_ENVELOPE_PREFIX) {
    throw new Error("Malformed ciphertext");
  }
  const plaintext = await subtle().decrypt(
    { name: "AES-GCM", iv: fromBase64Url(parts[1]) as BufferSource },
    dek,
    fromBase64Url(parts[2]) as BufferSource
  );
  return new TextDecoder().decode(plaintext);
}

export async function encryptBytes(
  dek: CryptoKey,
  data: ArrayBuffer
): Promise<Uint8Array> {
  const iv = randomBytes(IV_BYTES);
  const ciphertext = await subtle().encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    dek,
    data
  );
  const out = new Uint8Array(1 + IV_BYTES + ciphertext.byteLength);
  out[0] = BYTES_ENVELOPE_MAGIC;
  out.set(iv, 1);
  out.set(new Uint8Array(ciphertext), 1 + IV_BYTES);
  return out;
}

export async function decryptBytes(
  dek: CryptoKey,
  data: ArrayBuffer
): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(data);
  if (bytes.length <= 1 + IV_BYTES || bytes[0] !== BYTES_ENVELOPE_MAGIC) {
    throw new Error("Malformed encrypted file");
  }
  return subtle().decrypt(
    {
      name: "AES-GCM",
      iv: bytes.subarray(1, 1 + IV_BYTES) as BufferSource,
    },
    dek,
    bytes.subarray(1 + IV_BYTES) as BufferSource
  );
}

export function isEncryptedSpace(space: {
  encryption_version?: number | null;
}): boolean {
  return space.encryption_version === SPACE_ENCRYPTION_VERSION;
}
