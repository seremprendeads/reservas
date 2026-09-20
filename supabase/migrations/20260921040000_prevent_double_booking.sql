-- ============================================================================
-- CRITICO: nada impedia que dos clientes reservaran el mismo horario
--
-- El frontend (BookingForm.tsx) revisa los horarios ocupados una sola vez al
-- cargar el calendario y no vuelve a chequear antes de insertar. Si dos
-- personas confirman casi al mismo tiempo el mismo dia/hora para el mismo
-- negocio, las dos reservas se guardaban sin problema — el negocio quedaba
-- doblemente reservado. El propio codigo de BookingForm.tsx YA maneja el
-- error de restriccion unica (23505) mostrando "Ese horario ya fue reservado
-- por otra persona", pero esa restriccion nunca habia sido creada en la base.
--
-- Se usa un indice UNICO PARCIAL (solo sobre reservas activas: no canceladas
-- y no borradas) para no chocar con historial viejo donde el mismo horario
-- pudo haber tenido una reserva cancelada y otra reactivada despues.
--
-- ATENCION antes de correr esto: si ya existen dos reservas ACTIVAS (no
-- canceladas, no borradas) para el mismo negocio+fecha+hora, esta migracion
-- va a fallar con "could not create unique index... duplicate key". Si eso
-- pasa, hay que ubicar y resolver esos casos a mano primero (por ejemplo,
-- cancelando o reprogramando una de las dos) y volver a correr la migracion.
-- Para revisar antes de aplicar, correr:
--
--   SELECT business_id, booking_date, booking_time, count(*)
--   FROM bookings
--   WHERE deleted_at IS NULL AND booking_status <> 'cancelled'
--   GROUP BY business_id, booking_date, booking_time
--   HAVING count(*) > 1;
--
-- deleted_at existe y se usa desde admin-delete-booking/admin-restore-booking
-- (papelera de reservas), pero nunca quedo documentada en una migracion de
-- este repo — se deja explicita aca para que quede versionada.
-- ============================================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_active_slot
  ON bookings (business_id, booking_date, booking_time)
  WHERE deleted_at IS NULL AND booking_status <> 'cancelled';
