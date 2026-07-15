-- Emergency fix: ensure service_role can execute critical auth functions
-- The REVOKE from anon/authenticated may have inadvertently broken service_role access

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION verify_admin_password(TEXT, TEXT) TO service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION update_admin_password_direct(TEXT, TEXT) TO service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION update_admin_password(TEXT, TEXT, TEXT) TO service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT, TEXT) TO service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION generate_booking_code() TO service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION generate_booking_code(UUID) TO service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER, TEXT) TO service_role;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
