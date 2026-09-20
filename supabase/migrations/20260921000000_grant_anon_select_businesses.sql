-- ============================================================================
-- FIX: falta el GRANT de lectura sobre businesses para el rol anon
--
-- La política RLS "anon_read_own_business" (20260823000000) asume que el rol
-- anon ya tiene el permiso de tabla SELECT sobre businesses — las políticas
-- RLS solo filtran FILAS, pero antes de eso Postgres exige el permiso de
-- tabla. En este proyecto ese GRANT nunca se emitió explícitamente (solo se
-- otorgó sobre la vista public_businesses en 20260820000000), así que
-- cualquier lectura directa a businesses con la anon key fallaba con:
--   "permission denied for table businesses ... 42501"
--
-- Esto rompía BusinessContext.fetchBusinessById() en TODO login de admin
-- (no solo invitaciones nuevas) apenas la app se recargaba desde cero.
--
-- RLS sigue siendo la barrera real: solo expone negocios con is_active=true.
-- ============================================================================

GRANT SELECT ON public.businesses TO anon, authenticated;
