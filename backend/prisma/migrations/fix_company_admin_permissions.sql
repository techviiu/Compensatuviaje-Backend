-- =====================================================
-- FIX: Agregar permiso companies.read a rol COMPANY_ADMIN
-- Fecha: 2025-10-27
-- Problema: COMPANY_ADMIN tiene companies.update pero NO companies.read
-- =====================================================

-- 1. Verificar si existe el permiso companies.read
DO $$
DECLARE
    v_permission_id UUID;
    v_role_id UUID;
    v_exists BOOLEAN;
    v_code TEXT;
BEGIN
    -- Buscar el permiso companies.read
    SELECT id INTO v_permission_id
    FROM permissions
    WHERE code = 'companies.read';

    IF v_permission_id IS NULL THEN
        RAISE NOTICE 'ERROR: Permiso companies.read NO existe. Se debe crear primero.';
        
        -- Crear el permiso si no existe
        INSERT INTO permissions (id, code, name, description, created_at)
        VALUES (
            gen_random_uuid(),
            'companies.read',
            'Leer Empresas',
            'Permite leer informacion de empresas',
            NOW()
        )
        RETURNING id INTO v_permission_id;
        
        RAISE NOTICE 'OK: Permiso companies.read creado con ID: %', v_permission_id;
    ELSE
        RAISE NOTICE 'OK: Permiso companies.read ya existe con ID: %', v_permission_id;
    END IF;

    -- Buscar el rol COMPANY_ADMIN
    SELECT id INTO v_role_id
    FROM roles
    WHERE code = 'COMPANY_ADMIN';

    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'ERROR: Rol COMPANY_ADMIN NO existe en la base de datos';
    ELSE
        RAISE NOTICE 'OK: Rol COMPANY_ADMIN encontrado con ID: %', v_role_id;
    END IF;

    -- Verificar si ya existe la relacion
    SELECT EXISTS (
        SELECT 1
        FROM role_permissions
        WHERE role_id = v_role_id
        AND permission_id = v_permission_id
    ) INTO v_exists;

    IF v_exists THEN
        RAISE NOTICE 'INFO: La relacion ya existe. No se requiere accion.';
    ELSE
        -- Agregar la relacion Role -> Permission
        INSERT INTO role_permissions (id, role_id, permission_id, created_at)
        VALUES (
            gen_random_uuid(),
            v_role_id,
            v_permission_id,
            NOW()
        );
        
        RAISE NOTICE 'OK: Permiso companies.read agregado a rol COMPANY_ADMIN exitosamente';
    END IF;

    -- Mostrar permisos actuales del rol COMPANY_ADMIN
    RAISE NOTICE 'INFO: Permisos actuales de COMPANY_ADMIN:';
    FOR v_code IN 
        SELECT p.code
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = v_role_id
        ORDER BY p.code
    LOOP
        RAISE NOTICE '   - %', v_code;
    END LOOP;

END $$;

-- =====================================================
-- VERIFICACION FINAL
-- =====================================================
SELECT 
    r.code AS role,
    COUNT(rp.id) AS total_permissions,
    STRING_AGG(p.code, ', ' ORDER BY p.code) AS permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'COMPANY_ADMIN'
GROUP BY r.code;
