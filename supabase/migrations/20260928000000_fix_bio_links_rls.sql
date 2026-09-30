-- ============================================================================
-- FIX: la policy RLS "Public read active bio_links" rompe la lectura de enlaces
--
-- Problema: la migracion 20260921070000 revoco SELECT sobre bio_profiles para
-- anon/authenticated y movio toda lectura publica a la vista public_bio_profiles.
-- Pero la policy de bio_links ("Public read active bio_links") sigue validando
-- un subselect directo contra bio_profiles:
--
--   EXISTS (SELECT 1 FROM bio_profiles WHERE id = profile_id AND is_active = true)
--
-- Como anon/authenticated ya no tienen permiso de tabla sobre bio_profiles,
-- evaluar esa policy tira 42501 "permission denied for table bio_profiles" y la
-- consulta entera a bio_links falla. Eso deja SIN ENLACES a:
--   - la bio publica (BioPage.tsx)
--   - el panel de bio (BioAdmin.tsx: lista + preview)
--
-- Se reproduce con la anon key:
--   GET /rest/v1/bio_links  -> 42501 permission denied for table bio_profiles
--   GET /rest/v1/public_bio_profiles -> 200 OK
--
-- Solucion: apuntar el subselect a la vista public_bio_profiles (que ya expone
-- todo lo que la bio necesita salvo admin_email, y ya filtra is_active = true).
-- ============================================================================

DROP POLICY IF EXISTS "Public read active bio_links" ON bio_links;
CREATE POLICY "Public read active bio_links" ON bio_links
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM public_bio_profiles WHERE id = profile_id AND is_active = true)
  );