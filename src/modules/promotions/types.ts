export type DiscountType = 'percent' | 'fixed' | 'free';
export type AppliesTo = 'shop' | 'reservas' | 'both';

export type Promotion = {
  id: string;
  business_id: string;
  name: string;
  code: string;
  description: string | null;
  image_url: string | null;
  discount_type: DiscountType;
  discount_value: number;
  applies_to: AppliesTo;
  min_amount: number;
  max_uses: number | null;
  uses_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  show_in_bio: boolean;
  bio_label: string | null;
  created_at: string;
};

export function discountLabel(p: Pick<Promotion, 'discount_type' | 'discount_value'>): string {
  if (p.discount_type === 'free') return 'GRATIS';
  if (p.discount_type === 'percent') return `${Number(p.discount_value)}% OFF`;
  return `$${Number(p.discount_value).toLocaleString('es-AR')} OFF`;
}

export const APPLIES_LABEL: Record<AppliesTo, string> = {
  shop: 'Tienda',
  reservas: 'Reservas',
  both: 'Tienda y Reservas',
};
