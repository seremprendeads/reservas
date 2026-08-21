-- ============================================================================
-- MASTER ADMIN
-- Tabla separada de admin_users. No comparte roles ni auth con los tenants.
-- La autenticación usa MASTER_JWT_SECRET (distinto de JWT_SECRET).
-- ============================================================================

CREATE TABLE IF NOT EXISTS master_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE master_admins ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede acceder. Nunca expuesto a anon/authenticated.
CREATE POLICY "Service role manages master_admins" ON master_admins FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Reutilizar la función de hash de bcrypt existente para las contraseñas
-- (misma función que usan los admin_users)
-- create_master_admin: creación controlada solo por service_role (sin endpoint público)
CREATE OR REPLACE FUNCTION create_master_admin(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT
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
  -- Reutilizar la misma función de hash de bcrypt que admin_users
  SELECT crypt(p_password, gen_salt('bf', 10)) INTO v_hash;

  INSERT INTO master_admins (email, password_hash, name)
  VALUES (lower(trim(p_email)), v_hash, p_name)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Verificar password de master admin (igual que verify_admin_password pero para master_admins)
CREATE OR REPLACE FUNCTION verify_master_password(
  input_password TEXT,
  stored_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$;

-- Revocar acceso directo desde anon/authenticated
REVOKE EXECUTE ON FUNCTION create_master_admin(TEXT, TEXT, TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION verify_master_password(TEXT, TEXT) FROM anon, authenticated;

-- Índice para login por email
CREATE INDEX IF NOT EXISTS idx_master_admins_email ON master_admins(email);

-- ============================================================================
-- COMENTARIO DE CREACIÓN INICIAL
-- Para crear el primer Master Admin, ejecutar en SQL Editor de Supabase:
--
-- SELECT create_master_admin('tu@email.com', 'contraseña-segura', 'Tu Nombre');
--
-- NO existe endpoint público para registrarse como master.
-- ============================================================================
