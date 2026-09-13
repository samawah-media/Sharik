import { z } from "zod";
import { toClientSlug } from "@/modules/clients/client-repository";
import {
  isValidContactPhone,
  normalizeContactPhone,
} from "@/modules/clients/contact-phone";

const optionalText = z
  .string()
  .trim()
  .max(160)
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalPhone = z
  .preprocess(
    (value) => (typeof value === "string" ? normalizeContactPhone(value) : value),
    z
      .string()
      .max(40)
      .refine((value) => isValidContactPhone(value), {
        message: "invalid_contact_phone",
      }),
  )
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined));

export const createClientSchema = z.object({
  name: z.string().trim().min(2).max(120),
  primaryContactName: optionalText,
  primaryContactEmail: z.string().trim().email().optional().or(z.literal("")),
  primaryContactPhone: optionalPhone,
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
});

export const updateClientSchema = createClientSchema.extend({
  clientId: z.string().trim().min(1),
  expectedRevision: z.number().int().positive(),
});

export const normalizeClientInput = (name: string) => ({
  slug: toClientSlug(name),
});
