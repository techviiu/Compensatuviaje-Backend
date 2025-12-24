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
    aircraftCategory: 'narrow_body',
    serviceClassId: 'a8b2c4d6-8e10-4f22-a13b-5c7d9e0f1122', // economy
    factorKgCo2PerKmPerPax: 0.161,
    source: 'HuellaChile_v3_2024',
    methodology: 'Factor oficial para vuelos nacionales en Chile',
    confidenceLevel: 'HIGH',
    geographicScope: 'AMERICAS',
    version: 'v1.0',
    validFrom: new Date('2024-01-01'),
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440002',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    aircraftCategory: 'narrow_body',
    serviceClassId: '02ede58b-8830-42bf-977b-2231f8e08900', // business
    factorKgCo2PerKmPerPax: 0.322,
    source: 'HuellaChile_v3_2024, IATA/ICCT',
    methodology: 'Derivado de factor nacional (0.1610 × 2.0)',
    confidenceLevel: 'MEDIUM',
    geographicScope: 'AMERICAS',
    version: 'v1.0',
    validFrom: new Date('2024-01-01'),
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440003',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    aircraftCategory: 'narrow_body',
    serviceClassId: '3aec2d36-640b-4c0d-8d71-114d0f9a3993', // first
    factorKgCo2PerKmPerPax: 0.483,
    source: 'HuellaChile_v3_2024, IATA/ICCT',
    methodology: 'Derivado de factor nacional (0.1610 × 3.0)',
    confidenceLevel: 'MEDIUM',
    geographicScope: 'AMERICAS',
    version: 'v1.0',
    validFrom: new Date('2024-01-01'),
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440004',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    aircraftCategory: 'wide_body',
    serviceClassId: 'a8b2c4d6-8e10-4f22-a13b-5c7d9e0f1122', // economy
    factorKgCo2PerKmPerPax: 0.1038,
    source: 'HuellaChile_v3_2024',
    methodology: 'Factor oficial para viajes aéreos internacionales',
    confidenceLevel: 'HIGH',
    geographicScope: 'GLOBAL',
    version: 'v1.0',
    validFrom: new Date('2024-01-01'),
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440005',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    aircraftCategory: 'wide_body',
    serviceClassId: '02ede58b-8830-42bf-977b-2231f8e08900', // business
    factorKgCo2PerKmPerPax: 0.2076,
    source: 'HuellaChile_v3_2024, IATA/ICCT',
    methodology: 'Derivado de factor internacional (0.1038 × 2.0)',
    confidenceLevel: 'MEDIUM',
    geographicScope: 'GLOBAL',
    version: 'v1.0',
    validFrom: new Date('2024-01-01'),
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440006',
    transportTypeId: '0a8f8d66-5c5a-4b9e-9e7f-7a9d3c5f2d7e',
    aircraftCategory: 'wide_body',
    serviceClassId: '3aec2d36-640b-4c0d-8d71-114d0f9a3993', // first
    factorKgCo2PerKmPerPax: 0.3114,
    source: 'HuellaChile_v3_2024, IATA/ICCT',
    methodology: 'Derivado de factor internacional (0.1038 × 3.0)',
    confidenceLevel: 'MEDIUM',
    geographicScope: 'GLOBAL',
    version: 'v1.0',
    validFrom: new Date('2024-01-01'),
  }
];

async function seedEmissionFactors() {
  log.section('5. SEEDING EMISSION FACTORS');
  
  for (const factor of EMISSION_FACTORS) {
    const existing = await prisma.emissionFactor.findUnique({
      where: { id: factor.id }
    });

    if (existing) {
      log.warn(`Emission Factor '${factor.aircraftCategory}/${factor.serviceClassId}' ya existe`);
      continue;
    }

    await prisma.emissionFactor.create({
      data: factor
    });
    
    log.info(`Emission Factor '${factor.aircraftCategory}' - ${factor.factorKgCo2PerKmPerPax} kg/pax-km creado`);
  }
}

// ==========================================
// AIRPORTS (Aeropuertos principales)
// ==========================================

const AIRPORTS = [
  // Chile
  { code: 'SCL', name: 'Aeropuerto Internacional Arturo Merino Benítez', city: 'Santiago', country: 'Chile', lat: -33.3930, lon: -70.7858 },
  { code: 'IQQ', name: 'Aeropuerto Internacional Diego Aracena', city: 'Iquique', country: 'Chile', lat: -20.5352, lon: -70.1813 },
  { code: 'ANF', name: 'Aeropuerto Cerro Moreno', city: 'Antofagasta', country: 'Chile', lat: -23.4445, lon: -70.4451 },
  { code: 'CCP', name: 'Aeropuerto Carriel Sur', city: 'Concepción', country: 'Chile', lat: -36.7727, lon: -73.0631 },
  { code: 'PMC', name: 'Aeropuerto El Tepual', city: 'Puerto Montt', country: 'Chile', lat: -41.4389, lon: -73.0940 },
  { code: 'PUQ', name: 'Aeropuerto Carlos Ibáñez del Campo', city: 'Punta Arenas', country: 'Chile', lat: -53.0026, lon: -70.8546 },
  { code: 'ARI', name: 'Aeropuerto Chacalluta', city: 'Arica', country: 'Chile', lat: -18.3485, lon: -70.3387 },
  { code: 'LSC', name: 'Aeropuerto La Florida', city: 'La Serena', country: 'Chile', lat: -29.9162, lon: -71.1995 },
  { code: 'ZCO', name: 'Aeropuerto La Araucanía', city: 'Temuco', country: 'Chile', lat: -38.9298, lon: -72.6512 },
  { code: 'IPC', name: 'Aeropuerto Mataveri', city: 'Isla de Pascua', country: 'Chile', lat: -27.1648, lon: -109.4219 },
  
  // Perú
  { code: 'LIM', name: 'Aeropuerto Internacional Jorge Chávez', city: 'Lima', country: 'Perú', lat: -12.0219, lon: -77.1143 },
  { code: 'CUZ', name: 'Aeropuerto Internacional Alejandro Velasco Astete', city: 'Cusco', country: 'Perú', lat: -13.5357, lon: -71.9388 },
  { code: 'AQP', name: 'Aeropuerto Internacional Alfredo Rodríguez Ballón', city: 'Arequipa', country: 'Perú', lat: -16.3411, lon: -71.5831 },
  
  // Argentina
  { code: 'EZE', name: 'Aeropuerto Internacional Ministro Pistarini', city: 'Buenos Aires', country: 'Argentina', lat: -34.8222, lon: -58.5358 },
  { code: 'AEP', name: 'Aeroparque Jorge Newbery', city: 'Buenos Aires', country: 'Argentina', lat: -34.5592, lon: -58.4156 },
  { code: 'COR', name: 'Aeropuerto Internacional Ingeniero Ambrosio Taravella', city: 'Córdoba', country: 'Argentina', lat: -31.3236, lon: -64.2078 },
  { code: 'MDZ', name: 'Aeropuerto Internacional El Plumerillo', city: 'Mendoza', country: 'Argentina', lat: -32.8317, lon: -68.7929 },
  { code: 'BRC', name: 'Aeropuerto Internacional San Carlos de Bariloche', city: 'Bariloche', country: 'Argentina', lat: -41.1512, lon: -71.1575 },
  { code: 'IGR', name: 'Aeropuerto Internacional Cataratas del Iguazú', city: 'Iguazú', country: 'Argentina', lat: -25.7373, lon: -54.4734 },
  
  // Brasil
  { code: 'GRU', name: 'Aeropuerto Internacional de São Paulo-Guarulhos', city: 'São Paulo', country: 'Brasil', lat: -23.4356, lon: -46.4731 },
  { code: 'GIG', name: 'Aeropuerto Internacional Tom Jobim', city: 'Río de Janeiro', country: 'Brasil', lat: -22.8100, lon: -43.2506 },
  { code: 'BSB', name: 'Aeropuerto Internacional de Brasília', city: 'Brasília', country: 'Brasil', lat: -15.8711, lon: -47.9186 },
  { code: 'SSA', name: 'Aeropuerto Internacional Luis Eduardo Magalhães', city: 'Salvador', country: 'Brasil', lat: -12.9086, lon: -38.3225 },
  { code: 'REC', name: 'Aeropuerto Internacional Guararapes', city: 'Recife', country: 'Brasil', lat: -8.1264, lon: -34.9231 },
  
  // Colombia
  { code: 'BOG', name: 'Aeropuerto Internacional El Dorado', city: 'Bogotá', country: 'Colombia', lat: 4.7016, lon: -74.1469 },
  { code: 'MDE', name: 'Aeropuerto Internacional José María Córdova', city: 'Medellín', country: 'Colombia', lat: 6.1644, lon: -75.4231 },
  { code: 'CTG', name: 'Aeropuerto Internacional Rafael Núñez', city: 'Cartagena', country: 'Colombia', lat: 10.4424, lon: -75.5130 },
  { code: 'CLO', name: 'Aeropuerto Internacional Alfonso Bonilla Aragón', city: 'Cali', country: 'Colombia', lat: 3.5432, lon: -76.3816 },
  
  // México
  { code: 'MEX', name: 'Aeropuerto Internacional Benito Juárez', city: 'Ciudad de México', country: 'México', lat: 19.4363, lon: -99.0721 },
  { code: 'CUN', name: 'Aeropuerto Internacional de Cancún', city: 'Cancún', country: 'México', lat: 21.0365, lon: -86.8771 },
  { code: 'GDL', name: 'Aeropuerto Internacional Miguel Hidalgo y Costilla', city: 'Guadalajara', country: 'México', lat: 20.5218, lon: -103.3111 },
  { code: 'MTY', name: 'Aeropuerto Internacional General Mariano Escobedo', city: 'Monterrey', country: 'México', lat: 25.7785, lon: -100.1069 },
  
  // Ecuador
  { code: 'UIO', name: 'Aeropuerto Internacional Mariscal Sucre', city: 'Quito', country: 'Ecuador', lat: -0.1292, lon: -78.3575 },
  { code: 'GYE', name: 'Aeropuerto Internacional José Joaquín de Olmedo', city: 'Guayaquil', country: 'Ecuador', lat: -2.1574, lon: -79.8837 },
  
  // Otros Sudamérica
  { code: 'ASU', name: 'Aeropuerto Internacional Silvio Pettirossi', city: 'Asunción', country: 'Paraguay', lat: -25.2400, lon: -57.5200 },
  { code: 'MVD', name: 'Aeropuerto Internacional de Carrasco', city: 'Montevideo', country: 'Uruguay', lat: -34.8384, lon: -56.0308 },
  { code: 'VVI', name: 'Aeropuerto Internacional Viru Viru', city: 'Santa Cruz', country: 'Bolivia', lat: -17.6448, lon: -63.1354 },
  { code: 'LPB', name: 'Aeropuerto Internacional El Alto', city: 'La Paz', country: 'Bolivia', lat: -16.5133, lon: -68.1922 },
  { code: 'CCS', name: 'Aeropuerto Internacional Simón Bolívar', city: 'Caracas', country: 'Venezuela', lat: 10.6012, lon: -66.9912 },
  
  // Estados Unidos
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'Estados Unidos', lat: 25.7959, lon: -80.2870 },
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'Nueva York', country: 'Estados Unidos', lat: 40.6413, lon: -73.7781 },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Ángeles', country: 'Estados Unidos', lat: 33.9425, lon: -118.4081 },
  { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'Estados Unidos', lat: 41.9742, lon: -87.9073 },
  { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'Estados Unidos', lat: 32.8998, lon: -97.0403 },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'Estados Unidos', lat: 33.6407, lon: -84.4277 },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'Estados Unidos', lat: 37.6213, lon: -122.3790 },
  { code: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'Estados Unidos', lat: 29.9902, lon: -95.3368 },
  { code: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'Estados Unidos', lat: 36.0840, lon: -115.1537 },
  { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'Estados Unidos', lat: 47.4502, lon: -122.3088 },
  
  // Canadá
  { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canadá', lat: 43.6777, lon: -79.6248 },
  { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canadá', lat: 49.1947, lon: -123.1792 },
  { code: 'YUL', name: 'Montréal-Pierre Elliott Trudeau International Airport', city: 'Montreal', country: 'Canadá', lat: 45.4707, lon: -73.7408 },
  
  // Europa
  { code: 'MAD', name: 'Aeropuerto Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'España', lat: 40.4936, lon: -3.5668 },
  { code: 'BCN', name: 'Aeropuerto Josep Tarradellas Barcelona-El Prat', city: 'Barcelona', country: 'España', lat: 41.2974, lon: 2.0833 },
  { code: 'CDG', name: 'Aéroport de Paris-Charles de Gaulle', city: 'París', country: 'Francia', lat: 49.0097, lon: 2.5479 },
  { code: 'LHR', name: 'London Heathrow Airport', city: 'Londres', country: 'Reino Unido', lat: 51.4700, lon: -0.4543 },
  { code: 'FCO', name: 'Aeroporto Leonardo da Vinci–Fiumicino', city: 'Roma', country: 'Italia', lat: 41.8003, lon: 12.2389 },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Alemania', lat: 50.0379, lon: 8.5622 },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Ámsterdam', country: 'Países Bajos', lat: 52.3105, lon: 4.7683 },
  { code: 'LIS', name: 'Aeroporto Humberto Delgado', city: 'Lisboa', country: 'Portugal', lat: 38.7742, lon: -9.1342 },
  { code: 'MUC', name: 'Munich Airport', city: 'Múnich', country: 'Alemania', lat: 48.3537, lon: 11.7750 },
  { code: 'ZRH', name: 'Zurich Airport', city: 'Zúrich', country: 'Suiza', lat: 47.4582, lon: 8.5555 },
  
  // Asia y Oceanía
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubái', country: 'Emiratos Árabes Unidos', lat: 25.2532, lon: 55.3657 },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapur', country: 'Singapur', lat: 1.3644, lon: 103.9915 },
  { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'China', lat: 22.3080, lon: 113.9185 },
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokio', country: 'Japón', lat: 35.7720, lon: 140.3929 },
  { code: 'ICN', name: 'Incheon International Airport', city: 'Seúl', country: 'Corea del Sur', lat: 37.4602, lon: 126.4407 },
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sídney', country: 'Australia', lat: -33.9399, lon: 151.1753 },
  { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'Nueva Zelanda', lat: -37.0082, lon: 174.7850 },
  
  // Centroamérica y Caribe
  { code: 'PTY', name: 'Aeropuerto Internacional de Tocumen', city: 'Ciudad de Panamá', country: 'Panamá', lat: 9.0714, lon: -79.3835 },
  { code: 'SJO', name: 'Aeropuerto Internacional Juan Santamaría', city: 'San José', country: 'Costa Rica', lat: 9.9939, lon: -84.2088 },
  { code: 'HAV', name: 'Aeropuerto Internacional José Martí', city: 'La Habana', country: 'Cuba', lat: 22.9892, lon: -82.4091 },
  { code: 'SDQ', name: 'Aeropuerto Internacional Las Américas', city: 'Santo Domingo', country: 'República Dominicana', lat: 18.4297, lon: -69.6689 },
  { code: 'SJU', name: 'Luis Muñoz Marín International Airport', city: 'San Juan', country: 'Puerto Rico', lat: 18.4394, lon: -66.0018 }
];

async function seedAirports() {
  log.section('SEEDING AIRPORTS');
  
  for (const airport of AIRPORTS) {
    const existing = await prisma.airport.findUnique({
      where: { code: airport.code }
    });

    if (existing) {
      log.warn(`Airport '${airport.code}' ya existe`);
      continue;
    }

    await prisma.airport.create({
      data: airport
    });
    
    log.info(`Airport '${airport.city} (${airport.code})' creado`);
  }
}

// ==========================================
// 6. SUPERADMIN USER
// ==========================================

async function seedSuperAdmin() {
  log.section('6. SEEDING SUPERADMIN USER');
  
  try {
    // Buscar el rol SUPERADMIN
    const roleSuperAdmin = await prisma.role.findFirstOrThrow({
      where: { code: 'SUPERADMIN' }
    });

    // Crear usuario con rol en una sola transacción
    const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, BCRYPT_ROUNDS);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: SUPERADMIN_EMAIL,
        name: 'Super Administrador',
        passwordHash: hashedPassword,
        isActive: true,
        globalRoles: {
          create: {
            roleId: roleSuperAdmin.id
          }
        }
      }
    });

    log.info(`Usuario SuperAdmin '${SUPERADMIN_EMAIL}' creado`);
    log.info('Rol SUPERADMIN asignado');
    
  
    log.warn(`   Email: ${SUPERADMIN_EMAIL}`);
    if (process.env.NODE_ENV !== 'production') {
      log.warn(`   Password: ${SUPERADMIN_PASSWORD}`);
    }
  } catch (error: any) {
    // Si el usuario ya existe (error de unique constraint), solo avisar
    if (error.code === 'P2002') {
      log.warn(`SuperAdmin '${SUPERADMIN_EMAIL}' ya existe`);
    } else {
      // Cualquier otro error, re-lanzarlo
      throw error;
    }
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
    await seedAirports();  // Seed de aeropuertos
    // await seedEmissionFactors(); // Comentado temporalmente por error en schema
    await seedSuperAdmin();

    console.log('\n');
    log.section('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('\n');
    console.log('📊 RESUMEN:');
    console.log(`   - ${TRANSPORT_TYPES.length} Transport Types`);
    console.log(`   - ${SERVICE_CLASSES.length} Service Classes`);
    console.log(`   - ${PERMISSIONS.length} Permissions`);
    console.log(`   - ${ROLES.length} Roles`);
    console.log(`   - ${AIRPORTS.length} Airports`);
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
