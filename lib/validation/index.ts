import { z } from "zod";

/**
 * Standard Bangladeshi Mobile Number validator (e.g. 01712345678 or +8801712345678)
 */
export const bdPhoneSchema = z
  .string()
  .trim()
  .regex(
    /^(?:\+8801|01)[3-9]\d{8}$/,
    "Please enter a valid Bangladeshi mobile number (e.g. 017XXXXXXXX)"
  );

/**
 * URL Slug Schema for restaurants and table QR endpoints
 */
export const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(48, "Slug cannot exceed 48 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug can only contain lowercase letters, numbers, and hyphens"
  );

/**
 * Standard pagination query parameters
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});
