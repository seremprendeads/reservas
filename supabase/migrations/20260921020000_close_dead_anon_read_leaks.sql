-- ============================================================================
-- CRITICO: cerrar lecturas anonimas sin uso real en el codigo actual
--
-- Cada una de estas politicas fue agregada en algun momento para destrabar
-- una pantalla del panel, pero esa pantalla ya se movio a leer via una Edge
-- Function (que usa el cliente service_role y no pasa por estas policies).
-- La policy quedo activa igual, dando lectura publica con la anon key a
-- datos de TODOS los negocios de la plataforma. Verificado antes de aplicar
-- que ningun archivo en src/ depende de la version amplia de cada policy
-- (busqueda completa de .from('<tabla>') en todo el frontend).
--
-- 1) shop_orders: exponia nombre/telefono/email/monto/estado de pago de
--    TODOS los pedidos de TODOS los negocios sin login. El unico uso legitimo
--    (ShopPage.tsx consultando el estado de UN pedido puntual por id) queda
--    igual de bloqueado que el resto hasta que el checkout de Tienda se
--    reconstruya via Edge Function (ver admin-manage-shop / create-shop-payment
--    faltantes).
-- 2) shop_products ("Anon read all shop_products"): exponia productos
--    inactivos/en papelera (precio, stock, SKU) de todos los negocios. El
--    panel de Tienda ya usa exclusivamente admin-manage-shop (Edge Function),
--    no lee esta tabla directo.
-- 3) landing_pages ("Anon read landing_pages", USING(true)): exponia
--    borradores sin publicar de todos los negocios. El panel ya usa
--    admin-manage-landing (Edge Function); el sitio publico sigue
--    funcionando con la policy separada que ya filtra status = 'published'.
-- 4) invite_tokens: exponia email/negocio/rol/token de TODAS las
--    invitaciones pendientes de la plataforma. El frontend nunca lee esta
--    tabla directo (solo la Edge Function accept-invite, que usa
--    service_role y no necesita esta policy).
-- ============================================================================

DROP POLICY IF EXISTS "Anon read shop_orders" ON shop_orders;
DROP POLICY IF EXISTS "Anon read all shop_products" ON shop_products;
DROP POLICY IF EXISTS "Anon read landing_pages" ON landing_pages;
DROP POLICY IF EXISTS "Anon read invite_tokens by token" ON invite_tokens;

-- ============================================================================
-- calendar_integrations / calendar_sync_events / calendar_sync_logs:
-- la policy actual compara contra current_setting('app.current_tenant_id'),
-- una variable de sesion que este proyecto nunca setea (no usa Supabase
-- Auth). En la practica esto tira error en vez de filtrar filas, y solo
-- "funciona" hoy porque nada las lee con la anon key (todo pasa por
-- calendar-manage/calendar-sync, que usan service_role). Estas tablas
-- guardan access_token/refresh_token de Google en texto plano, asi que
-- conviene dejarlo explicito en vez de una policy rota que nunca se evalua
-- como uno espera.
-- ============================================================================

DROP POLICY IF EXISTS "calendar_integrations_tenant_isolation" ON calendar_integrations;
DROP POLICY IF EXISTS "calendar_sync_events_tenant_isolation" ON calendar_sync_events;
DROP POLICY IF EXISTS "calendar_sync_logs_tenant_isolation" ON calendar_sync_logs;

CREATE POLICY "Service role manages calendar_integrations" ON calendar_integrations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages calendar_sync_events" ON calendar_sync_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages calendar_sync_logs" ON calendar_sync_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
