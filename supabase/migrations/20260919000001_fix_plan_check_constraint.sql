-- ============================================================================
-- PLANES: ampliar el CHECK de businesses.plan a los 5 planes definitivos
--
-- Problema: master-update-tenant, business_has_module() y el selector
-- "Cambiar plan" del Master Admin ya usan free / bio_pro / bio_reservas /
-- bio_reservas_web / enterprise, pero el CHECK vigente (definido en
-- 20260901000000 commercial cycle.sql) solo permite free / pro / enterprise.
-- Asignar Bio Pro, Bio Pro + Reservas o Bio Pro + Reservas + Sitio web a un
-- negocio real falla en la base de datos.
--
-- Esto NO renombra, elimina ni reordena ningún plan: solo hace que la base
-- de datos acepte los mismos 5 nombres que el resto del sistema ya usa.
-- Se conserva 'pro' (plan anterior) para no romper negocios existentes que
-- ya tengan ese valor asignado — el propio panel Master lo muestra como
-- "Pro (plan anterior)": se puede ver pero ya no se ofrece al cambiar.
--
-- Valores que quedan permitidos, exactos:
--   free, bio_pro, bio_reservas, bio_reservas_web, enterprise, pro
--
-- No se toca ninguna fila existente: ampliar un CHECK es aditivo, los
-- valores actuales ya cumplían la restricción anterior (más estricta).
-- ============================================================================

ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_plan_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_plan_check
  CHECK (plan IN ('free', 'bio_pro', 'bio_reservas', 'bio_reservas_web', 'pro', 'enterprise'));
