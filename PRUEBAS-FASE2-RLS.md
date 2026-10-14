# Pruebas Fase 2 - RLS (H1..H6)

Estas pruebas NO se ejecutaron: requieren un entorno de staging (o el entorno de
desarrollo local con Supabase local/`db reset`), la aplicacion de las 3
migraciones de la Fase 2 y el despliegue de `admin-get-bio-stats` + frontend.
Es un PLAN de pruebas, no un resultado.

## Orden obligatorio

1. Backup/verify de produccion: correr `VERIFICAR-RLS-SUPABASE.sql` (solo lectura).
2. En STAGING: aplicar `20261012000000`, `20261012010000`, `20261012020000`.
3. Desplegar en staging: Edge Function `admin-get-bio-stats`, luego frontend.
4. Correr estas pruebas en staging.
5. NUNCA ejecutar pruebas de escritura contra produccion.

## Variables (placeholders)

- PROJECT_URL:   url del proyecto Supabase donde se pruebe (nunca produccion).
- ANON_KEY:      la `VITE_SUPABASE_ANON_KEY` del .env de staging.
- TOKEN_A/B:     localStorage `admin_token` tras loguearse en el negocio A/B.
- BUSINESS_A/B_ID: ids de dos negocios ACTIVOS distintos.
- BUSINESS_C_ID: un negocio inactivo o de plan sin Reservas.
- SERVICE_A_PRICE: precio exacto de un servicio activo de A.

SQL para juntar ids (solo lectura):

```sql
SELECT b.id AS business_id, b.slug, b.plan, b.is_trial, b.is_active
FROM businesses b ORDER BY b.created_at;

SELECT id, business_id, name, price, is_active FROM services
WHERE is_active = true ORDER BY created_at DESC LIMIT 20;
```

## H1 - Reservas y lista de espera (con ANON_KEY)

Los "Esperado" presuponen la migracion A aplicada en staging.

### 1. Reserva publica valida -> 201
```bash
curl -s -X POST "$PROJECT_URL/rest/v1/bookings" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"business_id\":\"$BUSINESS_A_ID\",\"booking_code\":\"RES-F2-01\",\"customer_name\":\"Prueba\",\"customer_phone\":\"+5491100000000\",\"customer_email\":\"p@test.com\",\"booking_date\":\"2026-12-01\",\"booking_time\":\"10:00\",\"payment_status\":\"pending\",\"booking_status\":\"pending\",\"amount\":$SERVICE_A_PRICE}"
```
Esperado: HTTP 201. Antes de la migracion A devolvia 401 (42501 por businesses).

### 2. Importe manipulado -> rechazado
Idem 1 con `amount` = 1 (no coincide con ningun servicio/settings): 401/403.

### 3. Estado manipulado -> rechazado
Idem 1 con `payment_status:"approved"` o `booking_status:"confirmed"`: 401/403.

### 4. Negocio inactivo o sin modulo reservas -> rechazado
Idem 1 pero con `business_id` = BUSINESS_C_ID: 401/403.

### 5. Negocio inexistente -> rechazado
Idem 1 con un UUID aleatorio: 401/403.

### 6. Reserva duplicada mismo horario -> 409 (23505)
Repetir el caso 1 dos veces en la misma fecha/hora: la segunda da 409
`23505 unique_violation` (indice unico de 20260921040000 intacto). Confirmar en
SQL que solo hay 1 reserva activa.

### 7. Lista de espera valida -> 201
```bash
curl -s -X POST "$PROJECT_URL/rest/v1/waiting_list" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"business_id\":\"$BUSINESS_A_ID\",\"nombre\":\"Prueba\",\"telefono\":\"+5491100000000\",\"email\":\"p@test.com\",\"fecha_deseada\":\"2026-12-02\",\"estado\":\"pendiente\"}"
```
Esperado: 201.

### 8. Lista de espera para negocio sin reservas -> rechazado
Idem 7 con BUSINESS_C_ID: 401/403.

### 9. anon NO puede leer bookings -> rechazado
```bash
curl -s "$PROJECT_URL/rest/v1/bookings?select=*" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
```
Esperado: 401/403 o 0 filas; nunca datos.

### 10. anon NO puede actualizar bookings.preference_id -> rechazado
```bash
curl -s -X PATCH "$PROJECT_URL/rest/v1/bookings?booking_code=eq.RES-F2-01" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" -d "{\"preference_id\":\"x\"}"
```
Esperado: 401/403 (H3: no existe policy UPDATE).

## H2 - RLS en services / branding / landing_pages

### 11. anon lee catalogo -> 200
```bash
curl -s "$PROJECT_URL/rest/v1/services?select=*" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
```
Esperado: 200 (la lectura publica sigue funcionando con RLS habilitado).

### 12. anon NO puede escribir services -> rechazado
```bash
curl -s -X POST "$PROJECT_URL/rest/v1/services" -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" -H "Content-Type: application/json" \
  -d "{\"business_id\":\"$BUSINESS_A_ID\",\"name\":\"hack\",\"price\":1}"
```
Esperado: 401/403 (50x si RLS quedara deshabilitado: seria falla de H2 a corregir).

### 13. anon lee branding y landing publicada -> 200
```bash
curl -s "$PROJECT_URL/rest/v1/branding?select=*" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
curl -s "$PROJECT_URL/rest/v1/landing_pages?select=*&status=eq.published" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
```
Esperado: 200 en ambos.

### 14. anon NO puede escribir landing_pages -> rechazado
```bash
curl -s -X POST "$PROJECT_URL/rest/v1/landing_pages" -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" -H "Content-Type: application/json" \
  -d "{\"business_id\":\"$BUSINESS_A_ID\",\"status\":\"published\"}"
```
Esperado: 401/403.

### 15. P0 repetido tras la migracion B
```bash
# en SQL Editor: relrowsecurity = true en las 3 tablas
SELECT relname, relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND relname IN ('services','branding','landing_pages');
```

## H3 - preference_id ya no se escribe desde el browser

### 16. Flujo completo de reserva con MP (staging)
Confirmar la reserva, pasar por create-payment y verificar en SQL que
`bookings.preference_id` se persistio (por service_role) y que el browser no hizo
ningun UPDATE anon (select de logs si existen). El webhook sigue correlacionando
por `booking_code`.

## H4 / H6 - Estadisticas de bio

### 17. El panel de Bio (tab stats) de A muestra SUS numeros
Logueado como A, abrir la pestaña estadisticas. Esperado: visitas/clics del
perfil de A. Con la Edge Function desplegada, `admin-get-bio-stats` devuelve
solo las stats del perfil derivado del JWT de A.

### 18. La Edge Function rechaza un token de otro negocio
```bash
curl -s -X POST "$PROJECT_URL/functions/v1/admin-get-bio-stats" \
  -H "Authorization: Bearer $TOKEN_B" -H "Content-Type: application/json" -d '{}'
```
Esperado: stats del perfil de B (nunca datos de A), o 403 si B esta sin acceso.

### 19. anon NO puede SELECT bio_stats -> 401/403 o vacio
```bash
curl -s "$PROJECT_URL/rest/v1/bio_stats?select=*" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
```

### 20. anon INSERT a un perfil INACTIVO -> rechazado (migracion H6)
```bash
curl -s -X POST "$PROJECT_URL/rest/v1/bio_stats" -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" -H "Content-Type: application/json" \
  -d "{\"profile_id\":\"<profile de negocio inactivo>\",\"event_type\":\"visit\"}"
```
Esperado: 401/403. Con un perfil activo: 201.

## H5 / Aislamiento entre negocios + panel + pagos

### 21. Aislamiento: token A no ve datos de B (bookings/panel)
```bash
curl -s -X POST "$PROJECT_URL/functions/v1/admin-get-panel-data" \
  -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" -d '{}'
```
Esperado: bookings/branding/settings solo de A.

### 22. Escritura anon directa en shop_products -> rechazado
```bash
curl -s -X POST "$PROJECT_URL/rest/v1/shop_products" -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" -H "Content-Type: application/json" \
  -d "{\"business_id\":\"$BUSINESS_A_ID\",\"name\":\"hack\",\"price\":1,\"is_active\":true}"
```
Esperado: 401/403 (el checkout publico solo INSERTA ordenes).

### 23. P4 repetido: ninguna funcion SECURITY DEFINER nueva expuesta a anon
Correr bloque P4 de `VERIFICAR-RLS-SUPABASE.sql`: 0 filas fuera de la allowlist.

### 24. Paginas publicas y panel funcionando (smoke)
- /<slug>/reservas: calendario, formulario, reserva y pago (staging).
- /<slug>/bio y /<slug>/tienda y landing publica: cargan.
- Panel admin de A: reservas, calendario, tienda, landing, bio (stats incluidas).

## Criterio de aprobacion

- H1: casos 1,7 aceptados; 2,3,4,5,6,8,9,10 rechazados (o 23505 en 6).
- H2: casos 11,13,15 OK; 12,14 rechazados. relrowsecurity=true en las 3 tablas.
- H3/H4: 16,17 OK; 18,19,20 segun lo esperado.
- H5: 21,22 rechazados; 23 = 0 filas; 24 sin regresiones.

Nada de esto fue ejecutado aun. Este archivo es el plan para staging.