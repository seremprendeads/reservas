-- ============================================================================
-- CRITICO: cerrar fuga de datos de clientes en bookings
--
-- La migracion 20260823000000_fix_admin_panel_read_access.sql agrego
-- "anon_read_bookings" (SELECT para anon/authenticated) justificandolo en que
-- useAdminBookings.loadData() leia bookings con la anon key. Eso ya no es
-- cierto: el panel de admin lee reservas exclusivamente via la Edge Function
-- admin-get-panel-data (service_role, con JWT propio del negocio). El
-- frontend publico (BookingForm.tsx, Calendar.tsx, Payment.tsx) tampoco hace
-- ningun SELECT directo a bookings, solo INSERT/UPDATE puntuales y llamadas a
-- Edge Functions separadas.
--
-- Resultado: la politica quedo sin ningun uso legitimo en el codigo actual,
-- pero seguia activa en la base — cualquiera con la anon key (esta en el
-- bundle JS publico de la app) podia hacer
--   supabase.from('bookings').select('*')
-- y traerse nombre, telefono, email, monto y estado de pago de TODAS las
-- reservas de TODOS los negocios activos de la plataforma, sin login.
--
-- Verificado antes de aplicar: no queda ningun SELECT anon a bookings en
-- src/ (grep completo), asi que sacar esta politica no rompe ninguna
-- pantalla existente.
-- ============================================================================

DROP POLICY IF EXISTS "anon_read_bookings" ON bookings;

-- No se recrea: sin esta policy, anon/authenticated no tienen SELECT sobre
-- bookings. Solo "Service role manages bookings" (ya existente) sigue activa.
