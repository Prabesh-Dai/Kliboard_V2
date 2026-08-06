import { z } from "zod";
import {
  DURATION_VALUES,
  RESERVED_NAMES,
  SPACE_NAME_MIN,
  SPACE_NAME_MAX,
  MAX_CONTENT_LENGTH,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_SPACE,
  MIN_SPACE_PASSWORD_LENGTH,
  MAX_SPACE_PASSWORD_LENGTH,
} from "@/lib/constants";

const spacePasswordSchema = z
  .string()
  .min(
    MIN_SPACE_PASSWORD_LENGTH,
    `Password must be at least ${MIN_SPACE_PASSWORD_LENGTH} characters`
  )
  .max(MAX_SPACE_PASSWORD_LENGTH, "Password too long");

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

const fileMetadataItemSchema = z.object({
  filename: z.string().min(1).max(255),
  storage_path: z.string().min(1),
  mime_type: z
    .string()
    .refine((v) => ALLOWED_MIME_TYPES.includes(v), "File type not allowed"),
  size_bytes: z
    .number()
    .positive()
    .max(MAX_FILE_SIZE_BYTES, "File too large (max 10MB)"),
});

export const createSpaceSchema = z
  .object({
    name: spaceNameSchema,
    content: z
      .string()
      .max(MAX_CONTENT_LENGTH, "Content too long")
      .optional()
      .default(""),
    duration: z
      .number()
      .optional()
      .default(5)
      .refine((v) => DURATION_VALUES.includes(v as number), "Invalid duration"),
    files: z.array(fileMetadataItemSchema).max(MAX_FILES_PER_SPACE).optional(),
    is_private: z.boolean().optional().default(false),
    password: spacePasswordSchema.optional(),
  })
  .refine((data) => !data.is_private || Boolean(data.password), {
    message: "A private space needs a password",
    path: ["password"],
  });

export const updateSpaceSchema = z.object({
  content: z.string().max(MAX_CONTENT_LENGTH).optional(),
  duration: z
    .number()
    .refine((v) => DURATION_VALUES.includes(v as number))
    .optional(),
});

export const claimSpaceSchema = z.object({
  token: z.string().min(16).max(256),
});

export const setVisibilitySchema = z.discriminatedUnion("is_private", [
  z.object({ is_private: z.literal(true), password: spacePasswordSchema }),
  z.object({ is_private: z.literal(false) }),
]);

export const verifySpacePasswordSchema = z.object({
  password: z.string().min(1).max(MAX_SPACE_PASSWORD_LENGTH),
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;
export type ClaimSpaceInput = z.infer<typeof claimSpaceSchema>;
export type SetVisibilityInput = z.infer<typeof setVisibilitySchema>;
