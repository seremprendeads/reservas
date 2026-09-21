-- ============================================================================
-- ALTO (auditoria pre-beta 21/09/2026): anon_insert_bookings no restringe
-- payment_status, booking_status ni amount
--
-- La policy actual (20260820000000) solo verifica que el negocio exista y
-- este activo. No dice nada sobre los VALORES que trae la fila:
--   - Cualquiera con la anon key podia insertar una reserva directo con
--     payment_status='approved' y booking_status='confirmed', sin haber
--     pagado nada. Se ve identica a una reserva paga real en el panel del
--     negocio.
--   - El campo amount tampoco se validaba contra ningun precio real: se
--     podia insertar cualquier numero inventado, lo que ensucia los
--     reportes de ingresos del panel (aunque el cobro real via Mercado
--     Pago ya esta a salvo desde antes: create-payment recalcula el monto
--     server-side y nunca confia en el amount de bookings).
--
-- El flujo legitimo (BookingForm.tsx) ya inserta siempre payment_status y
-- booking_status en 'pending', y un amount que sale de services.price
-- (leido antes con la misma anon key, via "Public read services"). Esta
-- policy ahora hace cumplir eso mismo a nivel de base de datos: no cambia
-- el flujo, solo impide que alguien salteando el frontend inserte otra
-- cosa.
--
-- Pasar a 'approved'/'confirmed' sigue siendo trabajo exclusivo del backend
-- (create-payment + mercadopago-webhook, o admin-create-booking), todos con
-- service_role — no pasan por esta policy y no se ven afectados.
-- ============================================================================

DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;

CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    business_id IS NOT NULL
    -- Una reserva creada por el visitante SIEMPRE arranca pendiente. Solo
    -- el backend (tras validar el pago, o el admin vía su propia función)
    -- puede pasarla a approved/confirmed.
    AND payment_status = 'pending'
    AND booking_status = 'pending'
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = bookings.business_id
        AND businesses.is_active = true
    )
    -- El importe tiene que coincidir con un precio real y vigente del
    -- negocio: el de algún servicio activo, o el precio general de
    -- settings — nunca un número inventado por el cliente.
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
