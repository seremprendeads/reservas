-- ============================================================================
-- RESERVAS: impedir doble reserva del mismo turno a nivel de base de datos
--
-- Problema: BookingForm.tsx inserta la reserva directo desde el navegador
-- (clave anon), sin ningún re-chequeo del lado del servidor en ese insert.
-- No existía ninguna restricción UNIQUE/EXCLUDE sobre
-- (business_id, booking_date, booking_time), así que dos clientes podían
-- reservar el mismo horario casi al mismo tiempo y quedar los dos
-- confirmados.
--
-- Solución: un índice único parcial que excluye las reservas canceladas.
-- Como máximo puede existir UNA reserva no cancelada por negocio, fecha y
-- hora. Si se cancela una reserva, ese horario vuelve a quedar libre para
-- una nueva. Esto protege sin importar qué camino de código hace el insert
-- (el formulario público, o cualquier función que inserte en bookings),
-- porque la restricción la aplica Postgres, no el código de la aplicación.
--
-- No requiere tocar ninguna fila existente: si hoy ya hubiera una reserva
-- duplicada real, esta migración fallaría al crear el índice (por diseño,
-- así avisa en vez de aplicarse a medias). Se verifica antes de aplicar.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_no_double_booking
  ON bookings (business_id, booking_date, booking_time)
  WHERE booking_status <> 'cancelled';
