-- ============================================================================
-- CICLO COMERCIAL BOOKINGBIO
-- Fecha: 2026-09-01
--
-- Cambios:
--   1. Plan enum: unificar a free | pro | enterprise (eliminar starter/beta/basic)
--   2. Trial: corregir trigger a 18 días exactos
--   3. admin_users: agregar must_change_password para credencial inicial
--   4. checkBusinessAccess en backend: plan 'free' = solo bio
--   5. Bio gratuita: máximo 3 links activos en plan free (vía función SQL)
--   6. invite_tokens: corregir RLS (auth.role() no funciona en Edge Functions)
--   7. Agregar índice compuesto para invite_tokens lookup por token
-- ============================================================================


-- ============================================================================
-- 1. UNIFICAR ENUM DE PLANES
--
-- Estado anterior (acumulado de migraciones):
--   DB acepta: free, beta, starter, pro, enterprise
--   master-update-tenant acepta: free, basic, pro, enterprise
--   frontend PLAN_MODULES: trial, free, basic, pro, enterprise
--
-- Decisión: free | pro | enterprise
--   - 'free'       → sin membresía activa, solo bio
--   - 'pro'        → plan pago estándar (bio + landing + reservas + shop)
--   - 'enterprise' → plan pago avanzado (todo + seo)
--
-- Migración de datos:
--   starter → pro  (equivalente más cercano)
--   beta    → pro  (plan de prueba pago → pro)
--   basic   → pro  (no existe en DB, pero por si hay registros)
--
-- El campo 'is_trial' sigue siendo la fuente de verdad para el estado trial.
-- El plan 'free' es el estado post-trial sin membresía.
-- ============================================================================

-- Migrar datos existentes antes de cambiar el constraint
UPDATE businesses SET plan = 'pro' WHERE plan IN ('starter', 'beta', 'basic');

-- Reemplazar el CHECK constraint
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_plan_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_plan_check
  CHECK (plan IN ('free', 'pro', 'enterprise'));


-- ============================================================================
-- 2. CORREGIR TRIGGER DE TRIAL A 18 DÍAS
--
-- La migración 20260715130000 creaba el trial con 14 días.
-- La fuente de verdad debe ser 18 días en todo el sistema.
-- ============================================================================

CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := now() + interval '18 days';
    NEW.is_trial := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- El trigger ya existe, se actualiza con la función reemplazada
-- (el trigger trg_set_trial_end ya apunta a set_trial_end_date)


-- ============================================================================
-- 3. CAMPO must_change_password EN admin_users
--
-- Cuando un admin es creado via invitación, se le asigna una contraseña
-- temporal y must_change_password = true.
-- El login devuelve este flag y el frontend fuerza el cambio antes de
-- permitir el acceso al panel.
-- Después del cambio exitoso, se setea a false.
-- ============================================================================

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;


-- ============================================================================
-- 4. FUNCIÓN: crear admin desde invitación (para uso del Master Admin)
--
-- Crea el admin_user con contraseña hasheada y must_change_password = true.
-- Solo ejecutable por service_role.
-- ============================================================================

CREATE OR REPLACE FUNCTION create_invited_admin(
  p_email TEXT,
  p_temp_password TEXT,
  p_name TEXT,
  p_business_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_hash TEXT;
  v_id UUID;
BEGIN
  -- Hashear la contraseña temporal con bcrypt
  SELECT crypt(p_temp_password, gen_salt('bf', 10)) INTO v_hash;

  INSERT INTO admin_users (email, password_hash, name, business_id, must_change_password)
  VALUES (lower(trim(p_email)), v_hash, p_name, p_business_id, true)
  ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        business_id = EXCLUDED.business_id,
        must_change_password = true
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_invited_admin(TEXT, TEXT, TEXT, UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION create_invited_admin(TEXT, TEXT, TEXT, UUID) TO service_role;


-- ============================================================================
-- 5. FUNCIÓN: verificar límite de 3 links en plan free
--
-- En plan free, la bio puede tener como máximo 3 links activos.
-- Esta función es llamada antes de activar/agregar un link.
-- ============================================================================

CREATE OR REPLACE FUNCTION bio_free_plan_link_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_business_id UUID;
  v_plan TEXT;
  v_is_trial BOOLEAN;
  v_trial_ends_at TIMESTAMPTZ;
  v_active_count INT;
BEGIN
  -- Obtener el business_id del profile
  SELECT bp.business_id INTO v_business_id
  FROM bio_profiles bp
  WHERE bp.id = NEW.profile_id;

  IF v_business_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener el estado del negocio
  SELECT plan, is_trial, trial_ends_at
  INTO v_plan, v_is_trial, v_trial_ends_at
  FROM businesses
  WHERE id = v_business_id;

  -- Si está en trial activo o plan pago, sin restricción
  IF v_is_trial AND (v_trial_ends_at IS NULL OR v_trial_ends_at > now()) THEN
    RETURN NEW;
  END IF;

  IF v_plan != 'free' THEN
    RETURN NEW;
  END IF;

  -- Plan free: máximo 3 links activos
  IF NEW.is_active THEN
    SELECT COUNT(*) INTO v_active_count
    FROM bio_links
    WHERE profile_id = NEW.profile_id
      AND is_active = true
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

    IF v_active_count >= 3 THEN
      RAISE EXCEPTION 'Plan gratuito: máximo 3 links activos permitidos';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_bio_free_plan_limit ON bio_links;
CREATE TRIGGER trg_bio_free_plan_limit
  BEFORE INSERT OR UPDATE ON bio_links
  FOR EACH ROW
  EXECUTE FUNCTION bio_free_plan_link_limit();


-- ============================================================================
-- 6. CORREGIR RLS DE invite_tokens
--
-- La migración 20260714 usaba auth.role() = 'service_role' que NO funciona
-- cuando la Edge Function usa el service role client directamente.
-- Reemplazar con la política estándar de todo el proyecto.
-- ============================================================================

DROP POLICY IF EXISTS "Service role manages invite_tokens" ON invite_tokens;
CREATE POLICY "Service role manages invite_tokens" ON invite_tokens
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Agregar lectura anon para que el frontend pueda verificar el token
-- sin autenticación (es la página pública de aceptación de invitación)
DROP POLICY IF EXISTS "Anon read invite_tokens by token" ON invite_tokens;
CREATE POLICY "Anon read invite_tokens by token" ON invite_tokens
  FOR SELECT TO anon, authenticated
  USING (
    accepted_at IS NULL
    AND expires_at > now()
  );


-- ============================================================================
-- 7. ÍNDICE ADICIONAL EN invite_tokens
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_invite_tokens_token_active
  ON invite_tokens(token)
  WHERE accepted_at IS NULL;


-- ============================================================================
-- VERIFICACIÓN (ejecutar en SQL Editor para confirmar):
--
-- SELECT DISTINCT plan FROM businesses;
-- -- Debe mostrar solo: free, pro, enterprise
--
-- SELECT prosrc FROM pg_proc WHERE proname = 'set_trial_end_date';
-- -- Debe contener: interval '18 days'
--
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'admin_users' AND column_name IN ('must_change_password','avatar_url');
-- -- Debe devolver 2 filas
-- ============================================================================