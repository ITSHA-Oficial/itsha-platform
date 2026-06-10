export interface CatalogDTO {
  schema_version: number;
  catalog_version: number;
  generated_at: string;
  total_products: number;
  tenant: {
    name: string;
    logo_url: string | null;
    primary_color: string;
  };
  categories: CatalogCategoryDTO[];
  products: CatalogProductDTO[];
}

export interface CatalogCategoryDTO {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
}

export interface CatalogProductDTO {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_slug: string | null;
  pricing_mode: 'explicit_variant' | 'dynamic_formula';
  display_price_mode: 'hidden' | 'from_price' | 'exact' | 'contact_only';
  formula_vars: string[] | null;
  primary_image_url: string | null;
  features: CatalogFeatureDTO[];
  variants: CatalogVariantDTO[];
}

export interface CatalogFeatureDTO {
  name: string;
  sort_order: number;
  attributes: { id: string; value: string; sort_order: number }[];
}

export interface CatalogVariantDTO {
  id: string;
  sku_variant: string | null;
  variant_signature: string;
  price: number;
  min_quantity: number | null;
  is_main: boolean;
  attributes: { feature_name: string; value: string }[];
}