-- ============================================================================
-- TRIAL: unificar la duración a 16 días
--
-- Contexto: la migración 20260901000000 dejó el trigger en 18 días, pero el
-- resto del sistema (comentarios, mensajes al cliente, panel Master) tenía
-- referencias mezcladas entre 16 y 18. Decisión comercial definitiva: 16 días.
-- TRIAL_DAYS en supabase/functions/_shared/auth.ts pasa a 16 en el mismo cambio.
--
-- Esto NO toca negocios existentes: el trigger solo asigna trial_ends_at
-- cuando la columna llega NULL (negocios nuevos, creados de acá en adelante).
-- Los negocios que ya tengan un trial_ends_at calculado con 18 días conservan
-- esa fecha sin cambios.
-- ============================================================================

CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := now() + interval '16 days';
    NEW.is_trial := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- El trigger trg_set_trial_end ya existe (creado en 20260715130000) y apunta
-- a esta función por nombre, así que no hace falta recrearlo.
