import { z } from "zod";
import {
  DURATION_VALUES,
  RESERVED_NAMES,
  SPACE_NAME_MIN,
  SPACE_NAME_MAX,
  MAX_CONTENT_LENGTH,
  MAX_ENCRYPTED_CONTENT_LENGTH,
  MAX_ENCRYPTED_METADATA_LENGTH,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_SPACE,
  MAX_SPACE_PASSWORD_LENGTH,
  SPACE_ENCRYPTION_VERSION,
} from "@/lib/constants";

const ENCRYPTED_SIZE_SLACK = 64;

const spaceNameSchema = z
  .string()
  .min(SPACE_NAME_MIN, "Name must be at least 3 characters")
  .max(SPACE_NAME_MAX, "Name must be at most 24 characters")
  .regex(
    /^[a-zA-Z][a-zA-Z-]*[a-zA-Z]$/,
    "Only letters and hyphens allowed"
  )
  .refine(
    (name) => !RESERVED_NAMES.includes(name.toLowerCase()),
    "This name is reserved"
  );

export const encryptionEnvelopeSchema = z.object({
  version: z.literal(SPACE_ENCRYPTION_VERSION),
  kdf_salt: z.string().min(16).max(128),
  kdf_iterations: z.number().int().min(100_000).max(10_000_000),
  wrapped_dek: z.string().min(16).max(512),
  auth_token: z.string().min(32).max(256),
});

const fileMetadataItemSchema = z
  .object({
    filename: z.string().min(1).max(MAX_ENCRYPTED_METADATA_LENGTH),
    storage_path: z.string().min(1),
    mime_type: z.string().min(1).max(MAX_ENCRYPTED_METADATA_LENGTH),
    size_bytes: z
      .number()
      .positive()
      .max(MAX_FILE_SIZE_BYTES + ENCRYPTED_SIZE_SLACK, "File too large (max 10MB)"),
    encryption_version: z.literal(SPACE_ENCRYPTION_VERSION).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.encryption_version) return;
    if (data.filename.length > 255) {
      ctx.addIssue({ code: "custom", message: "Filename too long", path: ["filename"] });
    }
    if (!ALLOWED_MIME_TYPES.includes(data.mime_type)) {
      ctx.addIssue({ code: "custom", message: "File type not allowed", path: ["mime_type"] });
    }
    if (data.size_bytes > MAX_FILE_SIZE_BYTES) {
      ctx.addIssue({ code: "custom", message: "File too large (max 10MB)", path: ["size_bytes"] });
    }
  });

export const createSpaceSchema = z
  .object({
    name: spaceNameSchema,
    content: z
      .string()
      .max(MAX_ENCRYPTED_CONTENT_LENGTH, "Content too long")
      .optional()
      .default(""),
    duration: z
      .number()
      .optional()
      .default(5)
      .refine((v) => DURATION_VALUES.includes(v as number), "Invalid duration"),
    files: z.array(fileMetadataItemSchema).max(MAX_FILES_PER_SPACE).optional(),
    is_private: z.boolean().optional().default(false),
    encryption: encryptionEnvelopeSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_private && !data.encryption) {
      ctx.addIssue({
        code: "custom",
        message: "A private space needs a password",
        path: ["encryption"],
      });
    }
    if (!data.is_private) {
      if (data.encryption) {
        ctx.addIssue({
          code: "custom",
          message: "Only private spaces are encrypted",
          path: ["encryption"],
        });
      }
      if (data.content.length > MAX_CONTENT_LENGTH) {
        ctx.addIssue({ code: "custom", message: "Content too long", path: ["content"] });
      }
    }
  });

export const updateSpaceSchema = z.object({
  content: z.string().max(MAX_ENCRYPTED_CONTENT_LENGTH).optional(),
  duration: z
    .number()
    .refine((v) => DURATION_VALUES.includes(v as number))
    .optional(),
});

export const claimSpaceSchema = z.object({
  token: z.string().min(16).max(256),
});

const fileRekeySchema = z.object({
  id: z.uuid(),
  storage_path: z.string().min(1),
  filename: z.string().min(1).max(MAX_ENCRYPTED_METADATA_LENGTH),
  mime_type: z.string().min(1).max(MAX_ENCRYPTED_METADATA_LENGTH),
  size_bytes: z
    .number()
    .positive()
    .max(MAX_FILE_SIZE_BYTES + ENCRYPTED_SIZE_SLACK),
});

export const setVisibilitySchema = z.discriminatedUnion("is_private", [
  z.object({
    is_private: z.literal(true),
    encryption: encryptionEnvelopeSchema,
    content: z.string().max(MAX_ENCRYPTED_CONTENT_LENGTH).optional(),
    files: z.array(fileRekeySchema).max(MAX_FILES_PER_SPACE).optional(),
  }),
  z.object({
    is_private: z.literal(false),
    content: z.string().max(MAX_CONTENT_LENGTH).optional(),
    files: z.array(fileRekeySchema).max(MAX_FILES_PER_SPACE).optional(),
  }),
]);

export const verifySpaceAccessSchema = z.union([
  z.object({ auth_token: z.string().min(32).max(256) }),
  z.object({ password: z.string().min(1).max(MAX_SPACE_PASSWORD_LENGTH) }),
]);

export const uploadUrlSchema = z.object({
  filename_hint: z.string().min(1).max(255).optional(),
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;
export type ClaimSpaceInput = z.infer<typeof claimSpaceSchema>;
export type SetVisibilityInput = z.infer<typeof setVisibilitySchema>;
export type EncryptionEnvelope = z.infer<typeof encryptionEnvelopeSchema>;
