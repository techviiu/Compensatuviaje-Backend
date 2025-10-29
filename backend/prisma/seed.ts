/**

 * ORDEN DE EJECUCIÓN:
 * 1. Transport Types (Tipos de transporte)
 * 2. Service Classes (Clases de servicio)
 * 3. Permissions (Permisos del sistema)
 * 4. Roles (Roles con sus permisos)
 * 5. Emission Factors (Factores de emisión)
 * 6. SuperAdmin User (Usuario superadministrador)
 * 
 * EJECUCIÓN:
 * - Automática en deploy: npx prisma migrate deploy
 * - Manual: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ==========================================
// CONFIGURACIÓN
// ==========================================

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
const SUPERADMIN_EMAIL = process.env.FIRST_SUPER_ADMIN_EMAIL || 'superadmin@compensatuviaje.com';
const SUPERADMIN_PASSWORD = process.env.FIRST_SUPER_ADMIN_PASSWORD || 'ChangeMeInProduction!';

// ==========================================
// UTILIDADES
// ==========================================

const log = {
  info: (msg: string) => console.log(`✅ ${msg}`),
  warn: (msg: string) => console.log(`⚠️  ${msg}`),
  error: (msg: string) => console.error(`❌ ${msg}`),
  section: (msg: string) => console.log(`\n${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}`)
};

// ==========================================
// 1. TRANSPORT TYPES
// ==========================================

const TRANSPORT_TYPES = [
  {
    id: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    code: 'aircraft',
    name: 'Aviación',
    description: 'Transporte aéreo de pasajeros y carga.',
    active: true
  }
];

async function seedTransportTypes() {
  log.section('1. SEEDING TRANSPORT TYPES');
  
  for (const transport of TRANSPORT_TYPES) {
    const existing = await prisma.transportType.findUnique({
      where: { id: transport.id }
    });

    if (existing) {
      log.warn(`Transport Type '${transport.name}' ya existe`);
      continue;
    }

    await prisma.transportType.create({
      data: transport
    });
    
    log.info(`Transport Type '${transport.name}' creado`);
  }
}

// ==========================================
// 2. SERVICE CLASSES
// ==========================================

const SERVICE_CLASSES = [
  {
    id: 'a8b2c4d6-8e10-4f22-a13b-5c7d9e0f1122',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    code: 'economy',
    name: 'Económica',
    spaceMultiplier: 1.00,
    comfortFactor: 1.00,
    description: 'Asientos estándar con servicios básicos.',
    active: true
  },
  {
    id: '1bd32cf8-98f2-4e32-9565-1afa9d5c7dc6',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    code: 'premium_economy',
    name: 'Económica Premium',
    spaceMultiplier: 1.40,
    comfortFactor: 1.00,
    description: 'Asientos más amplios y reclinables.',
    active: true
  },
  {
    id: '02ede58b-8830-42bf-977b-2231f8e08900',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    code: 'business',
    name: 'Ejecutiva',
    spaceMultiplier: 2.00,
    comfortFactor: 1.10,
    description: 'Asientos cama con servicio de alta calidad.',
    active: true
  },
  {
    id: '3aec2d36-640b-4c0d-8d71-114d0f9a3993',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    code: 'first',
    name: 'Primera Clase',
    spaceMultiplier: 3.00,
    comfortFactor: 1.20,
    description: 'Cabinas privadas y servicios exclusivos.',
    active: true
  }
];

async function seedServiceClasses() {
  log.section('2. SEEDING SERVICE CLASSES');
  
  for (const serviceClass of SERVICE_CLASSES) {
    const existing = await prisma.serviceClass.findUnique({
      where: { id: serviceClass.id }
    });

    if (existing) {
      log.warn(`Service Class '${serviceClass.name}' ya existe`);
      continue;
    }

    await prisma.serviceClass.create({
      data: serviceClass
    });
    
    log.info(`Service Class '${serviceClass.name}' creado`);
  }
}

// ==========================================
// 3. PERMISSIONS
// ==========================================

const PERMISSIONS = [
  // Auth
  { id: '550e8400-e29b-41d4-a716-446655440001', code: 'auth.login', name: 'Iniciar Sesión', description: 'Permite autenticarse en el sistema' },
  { id: '550e8400-e29b-41d4-a716-446655440002', code: 'auth.logout', name: 'Cerrar Sesión', description: 'Permite cerrar sesión' },
  
  // Users
  { id: '550e8400-e29b-41d4-a716-446655440003', code: 'users.create', name: 'Crear Usuarios', description: 'Crear nuevos usuarios en la empresa' },
  { id: '550e8400-e29b-41d4-a716-446655440004', code: 'users.read', name: 'Ver Usuarios', description: 'Ver lista de usuarios de la empresa' },
  { id: '550e8400-e29b-41d4-a716-446655440005', code: 'users.update', name: 'Actualizar Usuarios', description: 'Modificar datos de usuarios' },
  { id: '550e8400-e29b-41d4-a716-446655440006', code: 'users.delete', name: 'Eliminar Usuarios', description: 'Desactivar usuarios' },
  
  // Companies
  { id: '550e8400-e29b-41d4-a716-446655440007', code: 'companies.create', name: 'Crear Empresas', description: 'Registrar nuevas empresas' },
  { id: '550e8400-e29b-41d4-a716-446655440008', code: 'companies.read', name: 'Ver Empresas', description: 'Ver datos de empresas' },
  { id: '550e8400-e29b-41d4-a716-446655440009', code: 'companies.update', name: 'Actualizar Empresas', description: 'Modificar datos empresariales' },
  { id: '550e8400-e29b-41d4-a716-446655440010', code: 'companies.verify', name: 'Verificar Empresas', description: 'Aprobar/rechazar empresas' },
  
  // Uploads
  { id: '550e8400-e29b-41d4-a716-446655440011', code: 'uploads.create', name: 'Subir Archivos', description: 'Cargar manifiestos de vuelo' },
  { id: '550e8400-e29b-41d4-a716-446655440012', code: 'uploads.read', name: 'Ver Cargas', description: 'Ver estado de archivos subidos' },
  { id: '550e8400-e29b-41d4-a716-446655440013', code: 'uploads.process', name: 'Procesar Cargas', description: 'Ejecutar procesamientos masivos' },
  
  // Calculations
  { id: '550e8400-e29b-41d4-a716-446655440014', code: 'calculations.read', name: 'Ver Cálculos', description: 'Ver emisiones calculadas' },
  { id: '550e8400-e29b-41d4-a716-446655440015', code: 'calculations.export', name: 'Exportar Reportes', description: 'Descargar reportes de emisiones' },
  
  // Certificates
  { id: '550e8400-e29b-41d4-a716-446655440016', code: 'certificates.create', name: 'Crear Certificados', description: 'Solicitar certificados de compensación' },
  { id: '550e8400-e29b-41d4-a716-446655440017', code: 'certificates.read', name: 'Ver Certificados', description: 'Acceder a certificados emitidos' },
  
  // Payments
  { id: '550e8400-e29b-41d4-a716-446655440018', code: 'payments.create', name: 'Realizar Pagos', description: 'Procesar compensaciones' },
  { id: '550e8400-e29b-41d4-a716-446655440019', code: 'payments.read', name: 'Ver Pagos', description: 'Ver historial de transacciones' },
  
  // Admin
  { id: '550e8400-e29b-41d4-a716-446655440020', code: 'admin.system', name: 'Administración Sistema', description: 'Acceso completo administrativo' },
  { id: '550e8400-e29b-41d4-a716-446655440021', code: 'admin.audit', name: 'Ver Auditorías', description: 'Acceso a logs de auditoría' },
  { id: '550e8400-e29b-41d4-a716-446655440022', code: 'admin.catalogs', name: 'Gestionar Catálogos', description: 'Administrar aeropuertos, aeronaves, factores' }
];

async function seedPermissions() {
  log.section('3. SEEDING PERMISSIONS');
  
  for (const permission of PERMISSIONS) {
    const existing = await prisma.permission.findUnique({
      where: { id: permission.id }
    });

    if (existing) {
      log.warn(`Permission '${permission.code}' ya existe`);
      continue;
    }

    await prisma.permission.create({
      data: permission
    });
    
    log.info(`Permission '${permission.code}' creado`);
  }
}

// ==========================================
// 4. ROLES Y ROLE_PERMISSIONS
// ==========================================

const ROLES = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    code: 'SUPERADMIN',
    name: 'Super Administrador',
    description: 'Acceso total al sistema - Solo para CompensaTuViaje',
    permissions: PERMISSIONS.map(p => p.id) // Todos los permisos
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    code: 'COMPANY_ADMIN',
    name: 'Administrador Empresa',
    description: 'Administrador principal de la empresa',
    permissions: [
      '550e8400-e29b-41d4-a716-446655440001', // auth.login
      '550e8400-e29b-41d4-a716-446655440002', // auth.logout
      '550e8400-e29b-41d4-a716-446655440003', // users.create
      '550e8400-e29b-41d4-a716-446655440004', // users.read
      '550e8400-e29b-41d4-a716-446655440005', // users.update
      '550e8400-e29b-41d4-a716-446655440008', // companies.read
      '550e8400-e29b-41d4-a716-446655440009', // companies.update
      '550e8400-e29b-41d4-a716-446655440011', // uploads.create
      '550e8400-e29b-41d4-a716-446655440012', // uploads.read
      '550e8400-e29b-41d4-a716-446655440014', // calculations.read
      '550e8400-e29b-41d4-a716-446655440015', // calculations.export
      '550e8400-e29b-41d4-a716-446655440016', // certificates.create
      '550e8400-e29b-41d4-a716-446655440017', // certificates.read
      '550e8400-e29b-41d4-a716-446655440018', // payments.create
      '550e8400-e29b-41d4-a716-446655440019'  // payments.read
    ]
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    code: 'COMPANY_USER',
    name: 'Usuario Empresa',
    description: 'Usuario estándar con acceso a funciones básicas',
    permissions: [
      '550e8400-e29b-41d4-a716-446655440001', // auth.login
      '550e8400-e29b-41d4-a716-446655440002', // auth.logout
      '550e8400-e29b-41d4-a716-446655440011', // uploads.create
      '550e8400-e29b-41d4-a716-446655440012', // uploads.read
      '550e8400-e29b-41d4-a716-446655440014', // calculations.read
      '550e8400-e29b-41d4-a716-446655440017'  // certificates.read
    ]
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440004',
    code: 'COMPANY_VIEWER',
    name: 'Visualizador',
    description: 'Solo lectura de datos empresariales',
    permissions: [
      '550e8400-e29b-41d4-a716-446655440001', // auth.login
      '550e8400-e29b-41d4-a716-446655440002', // auth.logout
      '550e8400-e29b-41d4-a716-446655440012', // uploads.read
      '550e8400-e29b-41d4-a716-446655440014', // calculations.read
      '550e8400-e29b-41d4-a716-446655440017'  // certificates.read
    ]
  }
];

async function seedRoles() {
  log.section('4. SEEDING ROLES & PERMISSIONS');
  
  for (const role of ROLES) {
    const { permissions, ...roleData } = role;
    
    const existing = await prisma.role.findUnique({
      where: { id: role.id }
    });

    if (existing) {
      log.warn(`Role '${role.code}' ya existe`);
      
      // Verificar si necesita actualizar permisos
      const existingPerms = await prisma.rolePermission.findMany({
        where: { roleId: role.id }
      });

      if (existingPerms.length !== permissions.length) {
        log.info(`Actualizando permisos de '${role.code}'...`);
        
        // Eliminar permisos existentes
        await prisma.rolePermission.deleteMany({
          where: { roleId: role.id }
        });
        
        // Crear nuevos permisos
        for (const permissionId of permissions) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId
            }
          });
        }
        
        log.info(`Permisos de '${role.code}' actualizados (${permissions.length} permisos)`);
      }
      
      continue;
    }

    // Crear rol
    await prisma.role.create({
      data: roleData
    });
    
    log.info(`Role '${role.code}' creado`);

    // Crear permisos del rol
    for (const permissionId of permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId
        }
      });
    }
    
    log.info(`${permissions.length} permisos asignados a '${role.code}'`);
  }
}

// ==========================================
// 5. EMISSION FACTORS
// ==========================================

const EMISSION_FACTORS = [
  {
    id: '880e8400-e29b-41d4-a716-446655440001',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    aircraftType: 'narrow_body',
    serviceClassId: 'a8b2c4d6-8e10-4f22-a13b-5c7d9e0f1122', // economy
    factorKgCo2PerKmPerPax: 0.161,
    source: 'HuellaChile_v3_2024',
    methodology: 'Factor oficial para vuelos nacionales en Chile',
    confidenceLevel: 'HIGH',
    regionalScope: 'AMERICAS',
    version: 'v1.0',
    validFrom: new Date('2024-01-01'),
    active: true
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440002',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    aircraftType: 'narrow_body',
    serviceClassId: '02ede58b-8830-42bf-977b-2231f8e08900', // business
    factorKgCo2PerKmPerPax: 0.322,
    source: 'HuellaChile_v3_2024, IATA/ICCT',
    methodology: 'Derivado de factor nacional (0.1610 × 2.0)',
    confidenceLevel: 'MEDIUM',
    regionalScope: 'AMERICAS',
    version: 'v1.0',
    validFrom: new Date('2024-01-01'),
    active: true
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440003',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    aircraftType: 'narrow_body',
    serviceClassId: '3aec2d36-640b-4c0d-8d71-114d0f9a3993', // first
    factorKgCo2PerKmPerPax: 0.483,
    source: 'HuellaChile_v3_2024, IATA/ICCT',
    methodology: 'Derivado de factor nacional (0.1610 × 3.0)',
    confidenceLevel: 'MEDIUM',
    regionalScope: 'AMERICAS',
    version: 'v1.0',
    validFrom: new Date('2024-01-01'),
    active: true
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440004',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    aircraftType: 'wide_body',
    serviceClassId: 'a8b2c4d6-8e10-4f22-a13b-5c7d9e0f1122', // economy
    factorKgCo2PerKmPerPax: 0.1038,
    source: 'HuellaChile_v3_2024',
    methodology: 'Factor oficial para viajes aéreos internacionales',
    confidenceLevel: 'HIGH',
    regionalScope: 'GLOBAL',
    version: 'v1.0',
    validFrom: new Date('2024-01-01'),
    active: true
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440005',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    aircraftType: 'wide_body',
    serviceClassId: '02ede58b-8830-42bf-977b-2231f8e08900', // business
    factorKgCo2PerKmPerPax: 0.2076,
    source: 'HuellaChile_v3_2024, IATA/ICCT',
    methodology: 'Derivado de factor internacional (0.1038 × 2.0)',
    confidenceLevel: 'MEDIUM',
    regionalScope: 'GLOBAL',
    version: 'v1.0',
    validFrom: new Date('2024-01-01'),
    active: true
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440006',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    aircraftType: 'wide_body',
    serviceClassId: '3aec2d36-640b-4c0d-8d71-114d0f9a3993', // first
    factorKgCo2PerKmPerPax: 0.3114,
    source: 'HuellaChile_v3_2024, IATA/ICCT',
    methodology: 'Derivado de factor internacional (0.1038 × 3.0)',
    confidenceLevel: 'MEDIUM',
    regionalScope: 'GLOBAL',
    version: 'v1.0',
    validFrom: new Date('2024-01-01'),
    active:true
  }
];

async function seedEmissionFactors() {
  log.section('5. SEEDING EMISSION FACTORS');
  
  for (const factor of EMISSION_FACTORS) {
    const existing = await prisma.emissionFactor.findUnique({
      where: { id: factor.id }
    });

    if (existing) {
      log.warn(`Emission Factor '${factor.aircraftType}/${factor.serviceClassId}' ya existe`);
      continue;
    }

    await prisma.emissionFactor.create({
      data: factor
    });
    
    log.info(`Emission Factor '${factor.aircraftType}' - ${factor.factorKgCo2PerKmPerPax} kg/pax-km creado`);
  }
}

// ==========================================
// 6. SUPERADMIN USER
// ==========================================

async function seedSuperAdmin() {
  log.section('6. SEEDING SUPERADMIN USER');
  
  // Verificar si ya existe
  const existing = await prisma.user.findUnique({
    where: { email: SUPERADMIN_EMAIL }
  });

  if (existing) {
    log.warn(`SuperAdmin '${SUPERADMIN_EMAIL}' ya existe`);
    
    // Verificar si tiene el rol global
    const hasGlobalRole = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count
      FROM user_global_roles
      WHERE "userId" = ${existing.id}::uuid
      AND "roleId" = ${'660e8400-e29b-41d4-a716-446655440001'}::uuid
    `;

    if (!hasGlobalRole || hasGlobalRole[0].count === BigInt(0)) {
      await prisma.$executeRaw`
        INSERT INTO user_global_roles ("userId", "roleId")
        VALUES (${existing.id}::uuid, ${'660e8400-e29b-41d4-a716-446655440001'}::uuid)
        ON CONFLICT DO NOTHING
      `;
      log.info('Rol SUPERADMIN asignado al usuario existente');
    }
    
    return;
  }

  // Crear usuario
  const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, BCRYPT_ROUNDS);
  
  const superAdmin = await prisma.user.create({
    data: {
      email: SUPERADMIN_EMAIL,
      name: 'Super Administrador',
      passwordHash: hashedPassword,
      isActive: true
    }
  });

  log.info(`Usuario SuperAdmin '${SUPERADMIN_EMAIL}' creado`);

  // Asignar rol global SUPERADMIN usando raw SQL
  await prisma.$executeRaw`
    INSERT INTO user_global_roles ("userId", "roleId")
    VALUES (${superAdmin.id}::uuid, ${'660e8400-e29b-41d4-a716-446655440001'}::uuid)
    ON CONFLICT DO NOTHING
  `;

  log.info('Rol SUPERADMIN asignado');
  
  log.warn('⚠️  IMPORTANTE: Cambia la contraseña del SuperAdmin después del primer login');
  log.warn(`   Email: ${SUPERADMIN_EMAIL}`);
  if (process.env.NODE_ENV !== 'production') {
    log.warn(`   Password: ${SUPERADMIN_PASSWORD}`);
  }
}

// ==========================================
// MAIN SEED FUNCTION
// ==========================================

async function main() {
  console.log('\n');
  console.log('🌱 INICIANDO SEED DE BASE DE DATOS');
  console.log('==================================================\n');

  try {
    // Ejecutar seeds en orden
    await seedTransportTypes();
    await seedServiceClasses();
    await seedPermissions();
    await seedRoles();
    await seedEmissionFactors();
    await seedSuperAdmin();

    console.log('\n');
    log.section('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('\n');
    console.log('📊 RESUMEN:');
    console.log(`   - ${TRANSPORT_TYPES.length} Transport Types`);
    console.log(`   - ${SERVICE_CLASSES.length} Service Classes`);
    console.log(`   - ${PERMISSIONS.length} Permissions`);
    console.log(`   - ${ROLES.length} Roles`);
    console.log(`   - ${EMISSION_FACTORS.length} Emission Factors`);
    console.log(`   - 1 SuperAdmin User`);
    console.log('\n');
    console.log('🚀 El sistema está listo para usar!');
    console.log('\n');

  } catch (error) {
    log.error('Error durante el seed:');
    console.error(error);
    process.exit(1);
  }
}

// ==========================================
// EJECUCIÓN
// ==========================================

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
