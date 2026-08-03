-- Fix update_admin_password_direct and add update_admin_password_by_id

-- 1. Update update_admin_password_direct to handle case-insensitive email and throw if not found
CREATE OR REPLACE FUNCTION update_admin_password_direct(p_email TEXT, p_new_password TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE admin_users
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE LOWER(email) = LOWER(TRIM(p_email));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado para el email %', p_email;
  END IF;
END;
$$;

-- 2. Create update_admin_password_by_id for safer password updates using admin ID directly
CREATE OR REPLACE FUNCTION update_admin_password_by_id(p_id UUID, p_new_password TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE admin_users
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado para el ID %', p_id;
  END IF;
END;
$$;

-- 3. Grants and security policies
GRANT EXECUTE ON FUNCTION update_admin_password_direct(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_admin_password_by_id(UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION update_admin_password_direct(TEXT, TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_admin_password_by_id(UUID, TEXT) FROM anon, authenticated;
