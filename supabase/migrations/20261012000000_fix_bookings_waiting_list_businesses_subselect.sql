-- ============================================================================
-- FASE 2 - MIGRACION A (H1): reservas y lista de espera dejan de consultar la
-- tabla businesses dentro de la policy con la anon key.
--
-- PROBLEMA (reproducido en el repo, auditoria RLS 2026-10-12):
--   - "anon_insert_bookings" y "anon_insert_waiting_list" validan el negocio con
--     un subselect directo:
--         EXISTS (SELECT 1 FROM businesses WHERE id = ... AND is_active = true)
--   - La migracion 20260921050000 revoco SELECT sobre "businesses" a
--     anon/authenticated; las policies corren con los privilegios del rol que
--     consulta, asi que evaluar ese EXISTS tira
--       42501 permission denied for table businesses
--     y el INSERT publico de reservas / lista de espera falla (PostgREST
--     devuelve 401). Es el mismo patron que ya se corrigio para bio_links en
--     20260928000000_fix_bio_links_rls.sql.
--
-- SOLUCION:
--   - Quitar el subselect directo a businesses.
--   - Dejar la validacion de negocio en public.business_has_module(), que es
--     SECURITY DEFINER, ya existe desde 20260912000000 y devuelve true SOLO si
--     el negocio existe, esta activo (is_active) y su plan/trial incluye el
--     modulo 'reservas'. No hay que concederle SELECT a businesses a anon.
--   - Se conservan TODAS las validaciones de integridad: business_id NOT NULL,
--     payment_status = 'pending', booking_status = 'pending' (el estado de pago
--     solo lo mueve el backend con service_role), el importe debe coincidir con
--     un servicio activo o con settings.price.
--   - No toca el indice unico anti-doble-reserva (idx_bookings_unique_active_slot).
--
-- SEGURIDAD: no se restaura SELECT en businesses, no se agregan permisos a
-- anon/authenticated, no se reabren lecturas de bookings.
--
-- IDEMPOTENTE / REVISABLE: DROP POLICY IF EXISTS + CREATE POLICY; se puede
-- correr mas de una vez. ANTES DE APLICAR: ejecutar la verificacion A1 del
-- archivo VERIFICAR-RLS-SUPABASE.sql para comparar la definicion real en la
-- base con la que este repo asume.
--
-- REVERSION: reejecutar el DDL vigente previo (migracion 20260922020000).
-- ============================================================================


DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;

CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    business_id IS NOT NULL
    AND payment_status = 'pending'
    AND booking_status = 'pending'
    AND public.business_has_module(bookings.business_id, 'reservas')
    AND (
      EXISTS (
        SELECT 1 FROM services
        WHERE services.business_id = bookings.business_id
          AND services.is_active = true
          AND services.price = bookings.amount
      )
      OR EXISTS (
        SELECT 1 FROM settings
        WHERE settings.business_id = bookings.business_id
          AND settings.price = bookings.amount
      )
    )
  );


DROP POLICY IF EXISTS "anon_insert_waiting_list" ON waiting_list;

CREATE POLICY "anon_insert_waiting_list" ON waiting_list FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    business_id IS NOT NULL
    AND public.business_has_module(waiting_list.business_id, 'reservas')
  );


-- ============================================================================
-- VERIFICACION (ejecutar aparte en el SQL Editor, SOLO lectura):
--
-- 1) Las dos policies quedaron sin referencia a businesses:
--    SELECT tablename, policyname, with_check
--    FROM pg_policies
--    WHERE schemaname = 'public'
--      AND (tablename = 'bookings' AND policyname = 'anon_insert_bookings'
--           OR tablename = 'waiting_list' AND policyname = 'anon_insert_waiting_list');
--
-- 2) El subselect directo a businesses desaparecio del texto:
--    SELECT COUNT(*) AS refs_a_businesses
--    FROM pg_policies
--    WHERE schemaname = 'public'
--      AND tablename IN ('bookings','waiting_list')
--      AND (qual || with_check) ILIKE '%FROM businesses%';
--
-- 3) Prueba funcional en STAGING (nunca produccion):
--    INSERT una reserva valida con la anon key y luego ROLLBACK:
--      BEGIN;
--      SET LOCAL ROLE anon;
--      INSERT INTO bookings (business_id, booking_code, customer_name,
--                            customer_phone, customer_email, booking_date,
--                            booking_time, payment_status, booking_status, amount)
--      VALUES ('<business uuid con plan reservas>', 'RES-TEST-01', 'Prueba',
--              '+5491100000000', 'test@test.com', '2026-12-01', '10:00',
--              'pending', 'pending', <precio exacto de un servicio o settings>);
--      ROLLBACK;
-- ============================================================================