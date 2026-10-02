-- ============================================================================
-- C.4 - RETIRAR LA CREDENCIAL DEL MASTER ADMIN DEL TUTORIAL
--
-- Que pasa:
--   La migracion 20260820100000_master_admin.sql dejo escrito, en un comentario,
--   un ejemplo de creacion de master con un email y una contrasena reales:
--
--     SELECT create_master_admin('tu@email.com', '<password>', 'Tu Nombre');
--
--   Ninguna migracion ejecuta create_master_admin, asi que la cuenta se creo a
--   mano desde el SQL Editor. Consecuencia: la contrasena de esa cuenta quedo
--   escrita en el repositorio versionado. Eso la compromete aunque la cuenta
--   nunca se haya usado: el repositorio es la fuente, no el comentario.
--
-- Que hace esta migracion:
--   1. Desactiva la cuenta del tutorial en lugar de borrarla.
--      - Es reversible en una linea (ver el bloque de abajo).
--      - No se pierde el historial de la cuenta ni su id.
--      - Si en realidad se estaba usando, reactivarla requiere una decision
--        consciente del operador, no un efecto colateral de una limpieza.
--   2. Deja evidencia en el log cuando alguien intente usar la cuenta.
--
-- Por que NO se borra la fila:
--   Borrar un registro de autenticacion deja un hueco que no se puede
--   auditar. Desactivar deja claro que existio, cuando se desactivo y por que.
--   Si el operador confirma que la cuenta nunca se uso, el borrado definitivo se
--   puede hacer aparte con el DELETE comentado al final de esta migracion.
--
-- QUE ES ESTO Y QUE NO ES:
--   Esto elimina el riesgo de ACCESO con la credencial filtrada.
--   NO elimina la credencial del historial de git: sigue visible para quien
--   tenga acceso al historial del repositorio. Por eso la cuenta queda
--   desactivada en vez de confiar en que rotar alcanza.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Evidencia previa (no bloquea la migracion si la cuenta no existe)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_email TEXT := 'tu@email.com';
  v_row   master_admins%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM master_admins WHERE email = v_email;

  IF NOT FOUND THEN
    RAISE NOTICE 'C.4: la cuenta % no existe. Nada que desactivar.', v_email;
    RETURN;
  END IF;

  RAISE NOTICE 'C.4: cuenta % encontrada. is_active=% created_at=% updated_at=%',
    v_email, v_row.is_active, v_row.created_at, v_row.updated_at;

  -- Si updated_at nunca se movio desde created_at, la cuenta nunca se uso.
  IF v_row.updated_at = v_row.created_at THEN
    RAISE NOTICE 'C.4: updated_at = created_at, la cuenta NO registra uso.';
  ELSE
    RAISE NOTICE 'C.4: ATENCION, updated_at > created_at. La cuenta PUDO usarse.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Desactivar la cuenta del tutorial
--
-- Se condiciona a is_active = true para que la migracion sea idempotente:
-- correrla dos veces no rompe nada.
-- ---------------------------------------------------------------------------
UPDATE master_admins
SET is_active      = false,
    updated_at     = now()
WHERE email        = 'tu@email.com'
  AND is_active    = true;

-- ---------------------------------------------------------------------------
-- 3. Confirmacion. Esperado: 0 filas, o 1 fila con is_active = false.
-- ---------------------------------------------------------------------------
SELECT email, is_active, created_at, updated_at
FROM master_admins
WHERE email = 'tu@email.com';

-- ---------------------------------------------------------------------------
-- 4. Revertir (solo si el operador decide que la cuenta si se usaba)
-- ---------------------------------------------------------------------------
-- UPDATE master_admins
-- SET is_active = true, updated_at = now()
-- WHERE email = 'tu@email.com';

-- ---------------------------------------------------------------------------
-- 5. Borrado definitivo. NO ejecutar sin confirmar antes que la cuenta nunca
--    se uso. Correr el bloque 1 de CONSULTA-MASTER-Y-STORAGE.sql y confirmar
--    updated_at = created_at y que no hay negocios real dependientes de ella.
-- ---------------------------------------------------------------------------
-- DELETE FROM master_admins WHERE email = 'tu@email.com';