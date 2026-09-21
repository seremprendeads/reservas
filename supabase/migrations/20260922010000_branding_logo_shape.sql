-- ============================================================================
-- Agrega logo_shape a branding: elegir si el logo de Reservas se muestra
-- recortado en circulo (para un icono cuadrado) o completo sin recortar
-- (para un logo ancho, icono + texto). Mismo campo que ya existe en la
-- Landing Page (header.logo_shape), ahora tambien para el panel de Reservas.
--
-- Default 'circle' para que los negocios que ya tienen logo cargado sigan
-- viendose exactamente igual que antes.
-- ============================================================================

ALTER TABLE branding
  ADD COLUMN IF NOT EXISTS logo_shape TEXT NOT NULL DEFAULT 'circle';

-- Postgres no soporta "ADD CONSTRAINT IF NOT EXISTS", asi que se saca
-- primero (si ya existia de una corrida anterior) y se agrega de nuevo.
ALTER TABLE branding
  DROP CONSTRAINT IF EXISTS branding_logo_shape_check;

ALTER TABLE branding
  ADD CONSTRAINT branding_logo_shape_check
  CHECK (logo_shape IN ('circle', 'square'));
