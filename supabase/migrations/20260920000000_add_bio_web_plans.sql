-- ============================================================================
-- PLANES: agregar 'bio_web' (Plan 4) y 'bio_web_shop' (Plan 6)
--
-- Nueva estructura de catalogo (ver src/modules/subscription/lib/constants.ts):
--   1. free              -> bio
--   2. bio_pro           -> bio
--   3. bio_reservas      -> bio, reservas
--   4. bio_web           -> bio, landing               (NUEVO, sin reservas)
--   5. bio_reservas_web  -> bio, reservas, landing
--   6. bio_web_shop      -> bio, landing, shop          (NUEVO, sin reservas)
--   7. enterprise        -> bio, reservas, landing, shop, seo, landing_shop
--
-- Esto es aditivo: no se toca ninguna fila existente ni se renombra ningun
-- plan ya asignado. Sin esta migracion, asignar 'bio_web' o 'bio_web_shop'
-- desde Master falla en el CHECK, y aunque se lograra guardar, la funcion
-- business_has_module() todavia no sabria que modulos les corresponden.
-- ============================================================================

ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_plan_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_plan_check
  CHECK (plan IN ('free', 'bio_pro', 'bio_reservas', 'bio_web', 'bio_reservas_web', 'bio_web_shop', 'pro', 'enterprise'));

CREATE OR REPLACE FUNCTION public.business_has_module(p_business_id UUID, p_module TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = p_business_id
      AND b.is_active = true
      AND (
        -- Trial vigente: acceso completo
        (b.is_trial = true AND (b.trial_ends_at IS NULL OR b.trial_ends_at > now()))
        -- Trial vencido sin elegir plan: queda en Free (solo bio)
        OR (b.is_trial = true AND b.trial_ends_at <= now() AND p_module = 'bio')
        -- Planes pagos
        OR (b.is_trial = false AND b.plan = 'enterprise')
        OR (b.is_trial = false AND b.plan = 'pro' AND p_module IN ('bio', 'reservas', 'landing', 'shop'))
        OR (b.is_trial = false AND b.plan = 'bio_web_shop' AND p_module IN ('bio', 'landing', 'shop'))
        OR (b.is_trial = false AND b.plan = 'bio_reservas_web' AND p_module IN ('bio', 'reservas', 'landing'))
        OR (b.is_trial = false AND b.plan = 'bio_web' AND p_module IN ('bio', 'landing'))
        OR (b.is_trial = false AND b.plan = 'bio_reservas' AND p_module IN ('bio', 'reservas'))
        OR (b.is_trial = false AND b.plan IN ('free', 'bio_pro', 'starter') AND p_module = 'bio')
      )
  );
$$;
