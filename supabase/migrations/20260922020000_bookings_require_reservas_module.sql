-- ============================================================================
-- ALTO: anon_insert_bookings (y anon_insert_waiting_list) no chequeaban que
-- el plan del negocio incluya el modulo "reservas"
--
-- El cartel de "modulo bloqueado" en /reservas es solo una pantalla de
-- React (BookingPage.tsx: if (!isModuleEnabled('reservas')) return
-- <ModuleBlockedScreen />). Eso protege la interfaz, pero la policy de
-- INSERT en bookings/waiting_list nunca chequeaba el plan real del
-- negocio en la base — solo que existiera, estuviera activo, y que los
-- valores fueran razonables (ya arreglado en 20260921080000).
--
-- Resultado: un negocio con un plan sin Reservas (ej. "Bio Pro + Sitio
-- web") igual podia recibir una reserva insertada directo con la anon
-- key, salteando por completo la pantalla bloqueada — exactamente el
-- mismo patron que ya se cerro para Tienda (business_has_module(...,
-- 'shop')) y Landing Page (business_has_module(..., 'landing')), pero
-- nunca se habia aplicado a Reservas.
-- ============================================================================

DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;

CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    business_id IS NOT NULL
    AND payment_status = 'pending'
    AND booking_status = 'pending'
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = bookings.business_id
        AND businesses.is_active = true
    )
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
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = waiting_list.business_id
        AND businesses.is_active = true
    )
    AND public.business_has_module(waiting_list.business_id, 'reservas')
  );
