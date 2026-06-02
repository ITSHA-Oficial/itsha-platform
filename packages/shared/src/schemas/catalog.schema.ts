import { z } from 'zod';

export const catalogSchema = z.object({
  schema_version: z.number().int().min(1),
  catalog_version: z.number().int().min(1),
  generated_at: z.coerce.string().datetime(),
  total_products: z.number().int().min(0),
  tenant: z.object({
    name: z.string().min(1).max(200),
    logo_url: z.string().url().nullable(),
    primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/)
  }),
  categories: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100),
    image_url: z.string().url().nullable(),
    sort_order: z.number().int().min(0)
  })),
  products: z.array(z.object({
    id: z.string().uuid(),
    sku: z.string().min(1).max(100),
    name: z.string().min(1).max(200),
    description: z.string().max(2000).nullable(),
    category_slug: z.string().max(100).nullable(),
    pricing_mode: z.enum(['explicit_variant', 'dynamic_formula']),
    display_price_mode: z.enum(['hidden', 'from_price', 'exact', 'contact_only']),
    formula_vars: z.array(z.string()).nullable(),
    primary_image_url: z.string().url().nullable(),
    features: z.array(z.object({
      name: z.string().min(1).max(100),
      sort_order: z.number().int().min(0),
      attributes: z.array(z.object({
        id: z.string().uuid(),
        value: z.string().min(1).max(200),
        sort_order: z.number().int().min(0)
      }))
    })),
    variants: z.array(z.object({
      id: z.string().uuid(),
      sku_variant: z.string().max(100).nullable(),
      variant_signature: z.string().min(1).max(500),
      price: z.number().nonnegative(),
      min_quantity: z.number().int().nonnegative().nullable(),
      attributes: z.array(z.object({
        feature_name: z.string().min(1).max(100),
        value: z.string().min(1).max(200)
      }))
    }))
  }))
});

export type CatalogSchema = z.infer<typeof catalogSchema>;