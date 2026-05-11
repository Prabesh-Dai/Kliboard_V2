export const DURATION_OPTIONS = [
  { label: "5 minutes", value: 5 },
  { label: "1 hour", value: 60 },
  { label: "10 hours", value: 600 },
  { label: "1 day", value: 1440 },
  { label: "10 days", value: 14400 },
] as const;

export const ADMIN_DURATION_OPTIONS = [
  ...DURATION_OPTIONS,
  { label: "Unlimited", value: 0 },
] as const;

export const DURATION_VALUES: readonly number[] = [
  ...DURATION_OPTIONS.map((d) => d.value),
  0,
];

export const RESERVED_NAMES = [
  "api",
  "auth",
  "login",
  "register",
  "dashboard",
  "admin",
  "settings",
  "new",
  "space",
  "spaces",
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_SPACE_STORAGE_BYTES = 50 * 1024 * 1024;
export const MAX_FILES_PER_SPACE = 5;
export const MAX_CONTENT_LENGTH = 50000;
export const SPACE_NAME_MIN = 3;
export const SPACE_NAME_MAX = 24;
export const POLLING_INTERVAL_MS = 5000;

export const MAX_ANON_DURATION_MINUTES = 1440;
export const GLOBAL_ANON_SPACE_CAP = 1000;
export const SIGNED_URL_TTL_SECONDS = 3600;
export const ORPHAN_GRACE_MS = 60 * 60 * 1000;

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
  "audio/mpeg",
  "audio/wav",
];

export const AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
  "audio/mpeg",
  "audio/wav",
];

export const MAX_RECORDING_SECONDS = 300;
export const AUDIO_BITRATE_BPS = 64_000;
