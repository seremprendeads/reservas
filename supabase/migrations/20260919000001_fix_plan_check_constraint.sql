-- ============================================================================
-- PLANES: ampliar el CHECK de businesses.plan a los 7 planes definitivos
--
-- Problema: master-update-tenant, business_has_module() y el selector
-- "Cambiar plan" del Master Admin ya usan free / bio_pro / bio_reservas /
-- bio_reservas_web / enterprise (y poco despues bio_web / bio_web_shop),
-- pero el CHECK vigente (definido en 20260901000000 commercial cycle.sql)
-- solo permite free / pro / enterprise. Asignar Bio Pro, Bio Pro + Reservas
-- o Bio Pro + Reservas + Sitio web a un negocio real falla en la base.
--
-- Se incluyen aca bio_web y bio_web_shop (los dos planes de la migracion
-- 20260920000000 que le sigue) porque puede haber negocios reales ya con
-- ese valor en la base: sin ellos, este ALTER falla con 23514.
--
-- Esto NO renombra, elimina ni reordena ningún plan: solo hace que la base
-- de datos acepte los mismos 7 nombres que el resto del sistema ya usa.
-- Se conserva 'pro' (plan anterior) para no romper negocios existentes que
-- ya tengan ese valor asignado — el propio panel Master lo muestra como
-- "Pro (plan anterior)": se puede ver pero ya no se ofrece al cambiar.
--
-- Valores que quedan permitidos, exactos:
--   free, bio_pro, bio_reservas, bio_web, bio_reservas_web, bio_web_shop,
--   enterprise, pro
--
-- No se toca ninguna fila existente: ampliar un CHECK es aditivo, los
-- valores actuales ya cumplían la restricción anterior (más estricta).
-- ============================================================================

ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_plan_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_plan_check
  CHECK (plan IN ('free', 'bio_pro', 'bio_reservas', 'bio_web', 'bio_reservas_web', 'bio_web_shop', 'pro', 'enterprise'));
