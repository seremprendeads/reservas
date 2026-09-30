-- ============================================================
-- MIGRATION: Eliminar integracion con Google Calendar
-- Fecha: 2026-09-30
-- ============================================================
--
-- Por que se elimina:
--   La seccion "Integraciones" del panel ya no existe. El flujo OAuth nunca
--   llegaba a completarse (Google redirigia a /admin?code=... pero el panel
--   siempre volvia al dashboard, que no lee el ?code), no se importaban
--   eventos desde Google en ningun punto, y la "sincronizacion automatica"
--   no tenia ni trigger ni cron: era un toggle que solo escribia una columna.
--   Sin codigo que las use, las tablas quedan sin proposito.
--
-- Se eliminan las tres tablas, en orden de dependencia (logs y eventos
-- referencian a calendar_integrations).

DROP TABLE IF EXISTS calendar_sync_logs CASCADE;
DROP TABLE IF EXISTS calendar_sync_events CASCADE;
DROP TABLE IF EXISTS calendar_integrations CASCADE;
