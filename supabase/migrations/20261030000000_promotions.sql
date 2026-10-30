-- ============================================================================
-- PROMOCIONES / OFERTAS
--
-- Una promocion = un codigo con un descuento que el cliente final pega en el
-- carrito de la Tienda o en el pago de una Reserva. El mismo codigo se puede
-- mostrar en la Bio (boton desplegable con imagen + codigo para copiar).
--
-- SEGURIDAD: la tabla NO tiene ninguna policy para anon/authenticated. Nadie
-- puede leer la lista de codigos desde el navegador. Todo pasa por Edge
-- Functions con service_role:
--   - admin-manage-promotions  (el negocio las crea/edita, con su token)
--   - validate-promo           (el visitante prueba UN codigo y ve el descuento)
--   - create-payment / create-shop-payment (recalculan el descuento en el
--     servidor; el monto que cobra Mercado Pago nunca sale del navegador)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name           text NOT NULL,
  code           text NOT NULL,
  description    text,
  image_url      text,
  discount_type  text NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'free')),
  discount_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  applies_to     text NOT NULL DEFAULT 'both' CHECK (applies_to IN ('shop', 'reservas', 'both')),
  min_amount     numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_amount >= 0),
  max_uses       integer CHECK (max_uses IS NULL OR max_uses >= 1),
  uses_count     integer NOT NULL DEFAULT 0,
  starts_at      timestamptz,
  ends_at        timestamptz,
  is_active      boolean NOT NULL DEFAULT true,
  show_in_bio    boolean NOT NULL DEFAULT false,
  bio_label      text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promotions_percent_range CHECK (discount_type <> 'percent' OR discount_value BETWEEN 1 AND 100),
  CONSTRAINT promotions_fixed_positive CHECK (discount_type <> 'fixed' OR discount_value > 0)
);

-- El codigo se guarda siempre en MAYUSCULAS; unico por negocio.
CREATE UNIQUE INDEX IF NOT EXISTS uq_promotions_business_code ON public.promotions (business_id, code);
CREATE INDEX IF NOT EXISTS idx_promotions_business ON public.promotions (business_id);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.promotions FROM anon, authenticated;
GRANT ALL ON public.promotions TO service_role;

-- Que promo se uso y cuanto se descontó, para el historial del negocio.
ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS promo_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS promo_id uuid REFERENCES public.promotions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) NOT NULL DEFAULT 0;

-- Suma un uso cuando el pago se APRUEBA (no cuando se aplica el codigo), asi un
-- carrito abandonado no gasta usos. Solo service_role puede llamarla.
CREATE OR REPLACE FUNCTION public.increment_promo_use(p_promo_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.promotions SET uses_count = uses_count + 1 WHERE id = p_promo_id;
$$;

REVOKE ALL ON FUNCTION public.increment_promo_use(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_promo_use(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
