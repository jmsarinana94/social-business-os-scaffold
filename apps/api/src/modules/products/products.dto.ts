import { z } from 'zod';

// normalize enums (accept lower/upper from tests)
const TypeZ = z
  .enum(['PHYSICAL', 'DIGITAL'])
  .or(z.enum(['physical', 'digital']).transform((v) => v.toUpperCase() as 'PHYSICAL' | 'DIGITAL'));

const StatusZ = z
  .enum(['ACTIVE', 'INACTIVE'])
  .or(z.enum(['active', 'inactive']).transform((v) => v.toUpperCase() as 'ACTIVE' | 'INACTIVE'));

// price: accept number or string, canonicalize to string, max 2 decimals
const PriceZ = z.preprocess(
  (v) => (typeof v === 'number' ? v.toString() : v),
  z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'price must be a number with up to 2 decimals (e.g. 12 or 12.34)'),
);

const SkuZ = z.string().trim().max(64, 'sku must be <= 64 chars').optional();

export const CreateProductSchema = z.object({
  sku: SkuZ,
  title: z.string().trim().min(1, 'title is required').max(256),
  type: TypeZ,
  status: StatusZ,
  price: PriceZ,
  description: z.string().trim().max(10_000).nullable().optional().transform((v) => v ?? null),
});

export const UpdateProductSchema = z
  .object({
    sku: SkuZ,
    title: z.string().trim().min(1).max(256).optional(),
    type: TypeZ.optional(),
    status: StatusZ.optional(),
    price: PriceZ.optional(),
    description: z.string().trim().max(10_000).nullable().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
export type ProductTypeDto = z.infer<typeof TypeZ>;
export type ProductStatusDto = z.infer<typeof StatusZ>;