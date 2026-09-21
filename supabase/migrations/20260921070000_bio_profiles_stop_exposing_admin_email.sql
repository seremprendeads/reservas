-- ============================================================================
-- ALTO (auditoria pre-beta 21/09/2026): bio_profiles exponia admin_email
--
-- Mismo problema que ya se corrigio en businesses.owner_email
-- (20260921050000): "Public read active bio_profiles" es SELECT sin
-- restriccion de columnas, asi que cualquiera con la anon key podia hacer
--   GET /rest/v1/bio_profiles?select=admin_email,slug,name&is_active=eq.true
-- y traerse el email real del administrador de TODOS los negocios activos
-- de la plataforma, sin login.
--
-- Revisado el codigo: el frontend nunca lee ni muestra profile.admin_email
-- (ni en la Bio publica ni en el panel BioAdmin — ahi solo se usa como
-- placeholder en memoria antes de que exista el perfil, jamas se manda al
-- guardar ni se pinta en pantalla). No hace falta tocar la tabla ni la
-- columna: se resuelve igual que businesses, con una vista publica que
-- expone todo lo que la Bio (publica y admin) necesita, menos admin_email.
--
-- No se rompe nada:
-- - La Bio publica (BioPage.tsx) sigue funcionando igual, solo cambia de
--   donde lee.
-- - El panel admin (BioAdmin.tsx) sigue leyendo su propio perfil igual que
--   antes (mismo filtro is_active=true que ya tenia la policy anterior).
-- - Los guardados (admin-update-bio) no cambian: siguen yendo por
--   service_role, que no se ve afectado por este REVOKE.
-- ============================================================================

DROP VIEW IF EXISTS public_bio_profiles;
CREATE VIEW public_bio_profiles AS
  SELECT
    id,
    business_id,
    slug,
    name,
    description,
    avatar_url,
    city,
    whatsapp,
    email,
    website,
    social_instagram,
    social_tiktok,
    social_facebook,
    social_youtube,
    social_twitter,
    social_linkedin,
    social_icon_color,
    primary_color,
    title_color,
    description_color,
    bg_type,
    bg_solid_color,
    bg_gradient_from,
    bg_gradient_to,
    bg_image_url,
    bg_opacity,
    bg_overlay_color,
    button_style,
    button_shadow,
    is_active,
    created_at,
    updated_at
  FROM bio_profiles
  WHERE is_active = true;

GRANT SELECT ON public_bio_profiles TO anon, authenticated;

DROP POLICY IF EXISTS "Public read active bio_profiles" ON bio_profiles;
REVOKE SELECT ON bio_profiles FROM anon, authenticated;

-- Solo queda "Service role manages bio_profiles" (ya existente) para la
-- tabla real. Toda lectura sin ese rol pasa por la vista de arriba.
