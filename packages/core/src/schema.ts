import { z } from "zod";

export const SignatureSchema = z.object({
  algorithm: z.string().min(1),
  value: z.string().min(1),
  keyId: z.string().min(1)
});

export const CapabilityParameterSchema = z.object({
  type: z.enum([
    "string",
    "integer",
    "number",
    "boolean",
    "datetime",
    "phone",
    "email"
  ]),
  required: z.boolean(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional()
});

export const CapabilitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().url(),
  parameters: z.record(CapabilityParameterSchema),
  endpoint: z.string().url(),
  auth: z.enum(["none", "bearer", "did"]),
  price: z
    .object({
      amount: z.number(),
      currency: z.string().length(3)
    })
    .optional()
});

export const FactSchema = z.object({
  id: z.string().min(1),
  type: z.string().url(),
  value: z.unknown(),
  asOf: z.string().datetime(),
  signature: SignatureSchema.optional()
});

export const RenderHintsSchema = z.object({
  title: z.string().optional(),
  primary: z.array(z.string()).optional(),
  callsToAction: z.array(z.string()).optional(),
  theme: z
    .object({
      accent: z.string().optional()
    })
    .optional()
});

export const DaenaDocumentSchema = z.object({
  daena: z.literal("0"),
  publisher: z.string().min(1),
  facts: z.array(FactSchema),
  capabilities: z.array(CapabilitySchema),
  render: RenderHintsSchema.optional(),
  signature: SignatureSchema
});
