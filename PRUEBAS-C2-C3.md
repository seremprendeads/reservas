# Pruebas C.2 / C.3

Estas pruebas NO se pueden correr todavia: requieren la migracion aplicada y
`admin-storage-upload` desplegada. Se dejan preparadas para ejecutar en orden.

## Orden obligatorio

1. Aplicar las migraciones (ver abajo).
2. Desplegar `admin-storage-upload`.
3. Desplegar el frontend nuevo.
4. Correr las pruebas.

Si se aplica `20261002100000_lock_down_storage_writes.sql` antes de desplegar la
funcion y el frontend, TODOS los uploads quedan caidos. El orden no es opcional.

## Variables

- URL:            https://slsgkbepewxlsmzmcpri.supabase.co
- ANON_KEY:       la VITE_SUPABASE_ANON_KEY del .env
- TOKEN_A / TOKEN_B: localStorage `admin_token` tras loguearse en el panel del
                        negocio A y del negocio B respectivamente.
- BUSINESS_A_ID / BUSINESS_B_ID: ids de dos negocios distintos.
- LINK_B: id de un bio_link que pertenece a B.
- PROFILE_B: id del bio_profile de B.

SQL para juntar ids:

```sql
SELECT b.id AS business_id, b.slug, p.id AS profile_id
FROM businesses b
LEFT JOIN bio_profiles p ON p.business_id = b.id
ORDER BY b.created_at;

SELECT id, profile_id, title
FROM bio_links
ORDER BY created_at DESC
LIMIT 30;
```

## C.2 - Ownership de links (se usa TOKEN_A)

En los 4 casos, A intenta tocar un recurso de B. El atacante es un admin
autenticado, asi que el token es valido: esto es un IDOR, no un fallo de auth.

### 1. update_link ajeno -> debe fallar

```bash
curl -s -X POST "https://slsgkbepewxlsmzmcpri.supabase.co/functions/v1/admin-save-bio" \
  -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d "{\"action\":\"update_link\",\"link_id\":\"$LINK_B\",\"fields\":{\"title\":\"HACKEADO\"}}"
```

Esperado: HTTP 404, `{"error":"Link no encontrado."}`.
Confirmar en SQL que el titulo del link B NO cambio.

### 2. delete_link ajeno -> debe fallar

```bash
curl -s -X POST "https://slsgkbepewxlsmzmcpri.supabase.co/functions/v1/admin-save-bio" \
  -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d "{\"action\":\"delete_link\",\"link_id\":\"$LINK_B\"}"
```

Esperado: HTTP 404 y el link B sigue existiendo.

### 3. add_link con profile_id ajeno -> debe caer en el perfil de A

```bash
curl -s -X POST "https://slsgkbepewxlsmzmcpri.supabase.co/functions/v1/admin-save-bio" \
  -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d "{\"action\":\"add_link\",\"profile_id\":\"$PROFILE_B\",\"title\":\"prueba\",\"url\":\"https://ejemplo.com\"}"
```

Esperado: el link se crea con `profile_id` de A. Verificar en SQL que NO se creo
ningun link nuevo bajo PROFILE_B.

### 4. update_link propio -> debe funcionar

Igual que el 1 pero con el `link_id` de A. Esperado: HTTP 200 `{"success":true}`.

### 5. reorder_links con un id ajeno

```bash
curl -s -X POST "https://slsgkbepewxlsmzmcpri.supabase.co/functions/v1/admin-save-bio" \
  -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d "{\"action\":\"reorder_links\",\"updates\":[{\"id\":\"$LINK_B\",\"sort_order\":0}]}"
```

Esperado: no cambia el `sort_order` del link B (a lo sumo no hace nada).

## C.3 - Storage

### 6. anon ya no puede escribir (antes devolvia 200)

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://slsgkbepewxlsmzmcpri.supabase.co/storage/v1/object/branding/$BUSINESS_A_ID/prueba.webp" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: image/webp" \
  --data-binary @tiny.webp
```

Esperado: 403. Antes de la migracion esto devolvia 200.

En PowerShell, para generar tiny.webp y su base64:

```powershell
$bytes = [byte[]](0x52,0x49,0x46,0x46)  # placeholder; usar una imagen real chica
[IO.File]::WriteAllBytes("$PWD\tiny.webp", $bytes)
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("$PWD\tiny.webp"))
```

### 7. la funcion rechaza una carpeta ajena (TOKEN_A escribiendo en B)

```bash
curl -s -X POST "https://slsgkbepewxlsmzmcpri.supabase.co/functions/v1/admin-storage-upload" \
  -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d "{\"action\":\"upload\",\"bucket\":\"branding\",\"filename\":\"$BUSINESS_B_ID/hack.webp\",\"contentType\":\"image/webp\",\"dataBase64\":\"$B64\"}"
```

Esperado: HTTP 400, `No podes subir archivos a la carpeta de otro negocio`.
Es el test central de C.3: el path es correcto como formato pero apunta a otro
tenant, y aun asi se rechaza.

### 8. la funcion acepta la carpeta propia -> debe subir

Igual que el 7 pero con `filename` = `$BUSINESS_A_ID/ok.webp`.
Esperado: HTTP 200, `success:true` y `publicUrl`.

### 9. delete ajeno rechazado

Subir un archivo como B, y despues borrarlo con TOKEN_A:

```bash
curl -s -X POST "https://slsgkbepewxlsmzmcpri.supabase.co/functions/v1/admin-storage-upload" \
  -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d "{\"action\":\"delete\",\"bucket\":\"branding\",\"filename\":\"$BUSINESS_B_ID/archivo-de-B.webp\"}"
```

Esperado: HTTP 400 y el archivo de B sigue existiendo.

### 10. archivos viejos en carpetas raras

La consulta 6 de `CONSULTAR-MASTER-Y-STORAGE.sql` lista carpetas de branding que
no corresponden a ningun negocio (por ejemplo `default`). No se borran en esta
tarea: son archivos publicos de lectura, no una via de escritura. Se decide con
el operador si se limpian.

## F.1 - F.3 - Privilegios de funciones

Correr los bloques F de `CONSULTAR-MASTER-Y-STORAGE.sql` DESPUES de aplicar
`20261001090000_revoke_public_on_security_definer_functions.sql`.

Criterio de aprobacion:

- Bloque F.2 (privileged): TODAS `false` para `anon`/`authenticated`.
- Bloque F.3 (permitidas): TODAS `true`.
- Bloque C (service_role): TODAS `true`.
- Bloque D (barrido SECURITY DEFINER): 0 filas.
