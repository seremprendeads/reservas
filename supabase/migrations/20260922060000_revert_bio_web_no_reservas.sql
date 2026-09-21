-- ============================================================================
-- Plan 4 (bio_web · "Bio Pro + Sitio web") vuelve a NO incluir Reservas.
-- Deja business_has_module() en su estado original: bio_web = bio, landing.
-- ============================================================================

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
        (b.is_trial = true AND (b.trial_ends_at IS NULL OR b.trial_ends_at > now()))
        OR (b.is_trial = true AND b.trial_ends_at <= now() AND p_module = 'bio')
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
