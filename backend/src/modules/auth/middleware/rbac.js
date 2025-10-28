/**
 * 
 * Control de acceso basado en roles y permisos
 * Actualizado para soportar SuperAdmin sin empresa
 * 
 * USO EN OTROS MÓDULOS:
 * - MOD-AUTH: Control interno
 * - MOD-ONBOARD: Verificación permisos registro empresas
 * - MOD-UPLOAD: Control carga manifiestos
 * - MOD-CERTIFICATES: Generación y gestión certificados
 * - Todos los módulos futuros
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../../../utils/logger');

const prisma = new PrismaClient();

/**
 * Verificar que el usuario tiene los permisos requeridos
 * @param {Array} requiredPermissions - Array de códigos de permisos requeridos
 * NUEVO: Ahora tiene soporte para empresas de onboarding
 */
const requirePermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      // SuperAdmin tiene todos los permisos automáticamente
      if (req.user.isSuperAdmin || await checkIfSuperAdmin(userId)) {
        req.user.isSuperAdmin = true;
        req.user.permissions = ['*']; // Wildcard para todos los permisos
        
        logger.debug('SuperAdmin access granted', {
          userId,
          requiredPermissions,
          url: req.url
        });
        
        return next();
      }

      // Obtener permisos del usuario a través de sus roles en empresas
      const userPermissions = await getUserPermissions(userId);

      // Verificar si tiene todos los permisos requeridos
      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(p => !userPermissions.includes(p));
        const companyStatus = req.user?.company?.status;
        
        // ✅ BYPASS: COMPANY_ADMIN puede leer su propia empresa en rutas de onboarding
        const isOnboardingRoute = req.url.includes('/onboard/companies');
        const isReadingOwnCompany = req.params?.id === req.user?.company_id || req.params?.companyId === req.user?.company_id;
        const isCompanyAdmin = req.user?.role === 'COMPANY_ADMIN';
        const isReadingCompany = missingPermissions.length === 1 && missingPermissions[0] === 'companies.read';
        
        if (isOnboardingRoute && isReadingOwnCompany && isCompanyAdmin && isReadingCompany) {
          logger.debug('COMPANY_ADMIN bypass for reading own company during onboarding', {
            userId,
            company_id: req.user?.company_id,
            companyStatus
          });
          
          // Permitir acceso con bypass temporal
          req.user.permissions = [...userPermissions, 'companies.read'];
          return next();
        }

        let message = 'No tienes permisos suficientes para esta acción';
        let errorCode = 'INSUFFICIENT_PERMISSIONS';
        let suggestions = [];

        // Distinguir entre falta de permisos vs restricción por estado
        if (missingPermissions.length === 0 && companyStatus && companyStatus !== 'active') {
          // Tiene permisos pero la empresa no está activa (para rutas operacionales)
          message = 'Esta acción requiere que la empresa esté activa';
          errorCode = 'COMPANY_NOT_ACTIVE';
          suggestions = getOnboardingSuggestions(companyStatus);
        } else if (missingPermissions.length > 0) {
          // Le faltan permisos reales
          message = `No tienes los permisos necesarios: ${missingPermissions.join(', ')}`;
          errorCode = 'INSUFFICIENT_PERMISSIONS';
          suggestions = [
            'Contacta al administrador de tu empresa para solicitar permisos',
            'Verifica que tu rol incluya los permisos necesarios'
          ];
        }

        logger.warn('Permission denied', {
          userId,
          requiredPermissions,
          userPermissions,
          missingPermissions,
          companyStatus,
          url: req.url,
          method: req.method,
          ip: req.ip
        });

        return res.status(403).json({
          success: false,
          error_code: errorCode,
          message,
          required: requiredPermissions,
          missing: missingPermissions,
          company_status: companyStatus,
          suggestions
        });
      }

      req.user.permissions = userPermissions;
      
      logger.debug('Permission granted', {
        userId,
        permissions: requiredPermissions,
        url: req.url
      });
      
      next();

    } catch (error) {
      logger.error('Error checking permissions', {
        error: error.message,
        userId: req.user?.id,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'Error verificando permisos'
      });
    }
  };
};

/**
 * Verificar si el usuario es SuperAdmin
 * @param {string} userId - ID del usuario
 * @returns {boolean} true si es SuperAdmin
 */
const checkIfSuperAdmin = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    // SuperAdmin identificado por email configurado en .env
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'admin@compensatuviaje.com';
    
    return user?.email === superAdminEmail;
    
  } catch (error) {
    logger.error('Error checking SuperAdmin', { 
      error: error.message,
      userId 
    });
    return false;
  }
};

/**
 * Obtener todos los permisos del usuario
 * @param {string} userId - ID del usuario
 * @returns {Array} Array de códigos de permisos
 */
const getUserPermissions = async (userId) => {
  try {
    const companyUsers = await prisma.companyUser.findMany({
          where: {
        userId,
        status: 'active'
      },
      include: {
        company: {
          select: {
            id: true,
            status: true,
            razonSocial: true
          }
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Extraer permisos únicos de todos los roles
    const permissions = new Set();

    companyUsers.forEach(companyUser => {
      companyUser.roles.forEach(userRole => {
        userRole.role.permissions.forEach(rolePermission => {
          permissions.add(rolePermission.permission.code);
        });
      });
    });

    return Array.from(permissions);

  } catch (error) {
    logger.error('Error getting user permissions', {
      error: error.message,
      userId
    });
    return [];
  }
};

/**
 * Verificar que el usuario tiene al menos uno de los roles especificados
 * @param {Array} allowedRoles - Array de códigos de roles permitidos
 */
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      logger.info("🧟‍♂️", req.user )

      // SuperAdmin bypasses role check
      if (await checkIfSuperAdmin(userId)) {
        req.user.isSuperAdmin = true;
        req.user.roles = ['SUPERADMIN'];
        return next();
      }

      const userRoles = await getUserRoles(userId);

      const hasRole = userRoles.some(role => allowedRoles.includes(role));

      if (!hasRole) {
        logger.warn('Role check failed', {
          userId,
          requiredRoles: allowedRoles,
          userRoles,
          url: req.url,
          ip: req.ip
        });

        return res.status(403).json({
          success: false,
          message: 'No tienes el rol necesario para esta acción',
          required: allowedRoles,
          current: userRoles
        });
      }

      req.user.roles = userRoles;
      next();

    } catch (error) {
      logger.error('Error checking roles', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Error verificando roles'
      });
    }
  };
};

/**
 * Obtener roles del usuario
 * @param {string} userId - ID del usuario
 * @returns {Array} Array de códigos de roles
 */
const getUserRoles = async (userId) => {
  try {
    const companyUsers = await prisma.companyUser.findMany({
      where: {
        userId,
        status: 'active'
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    const roles = new Set();

    companyUsers.forEach(companyUser => {
      companyUser.roles.forEach(userRole => {
        roles.add(userRole.role.code);
      });
    });

    return Array.from(roles);

  } catch (error) {
    logger.error('Error getting user roles', {
      error: error.message,
      userId
    });
    return [];
  }
};

/**
 * Verificar que el usuario es admin de la empresa especificada
 * Usado en conjunto con checkCompanyAccess del módulo onboard
 */
const requireCompanyAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // SuperAdmin siempre tiene acceso admin
    if (await checkIfSuperAdmin(userId)) {
      req.user.isSuperAdmin = true;
      return next();
    }

    // Verificar que userCompany existe (debe venir de checkCompanyAccess middleware)
    if (!req.userCompany) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta empresa'
      });
    }

    // Verificar que es admin de la empresa
    if (!req.userCompany.isAdmin) {
      logger.warn('Company admin required', {
        userId,
        companyId: req.params.id,
        isAdmin: req.userCompany.isAdmin
      });

      return res.status(403).json({
        success: false,
        message: 'Requiere permisos de administrador de la empresa'
      });
    }

    next();

  } catch (error) {
    logger.error('Error checking company admin', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Error verificando permisos de administrador'
    });
  }
};

/**
 * Middleware dinámico de permisos basado en recurso
 * Útil para rutas RESTful estándar
 * 
 * @param {string} resourceType - Tipo de recurso (ej: 'companies', 'documents')
 */
const checkResourcePermission = (resourceType) => {
  return (req, res, next) => {
    try {
      // Mapeo dinámico de método HTTP a acción de permiso
      const actionMap = {
        'GET': 'read',
        'POST': 'create',
        'PUT': 'update',
        'PATCH': 'update',
        'DELETE': 'delete'
      };

      const action = actionMap[req.method] || 'access';
      const permission = `${resourceType}.${action}`; // ej: "companies.read", "documents.create"

      // Reutilizar requirePermissions con el permiso dinámico
      return requirePermissions([permission])(req, res, next);

    } catch (error) {
      logger.error('Resource permission middleware error', {
        error: error.message,
        resourceType,
        method: req.method,
        path: req.path
      });

      res.status(500).json({
        success: false,
        message: 'Error verificando permisos de recurso'
      });
    }
  };
};

/**
 * Shortcuts comunes para permisos frecuentes
 * Facilita el uso en las rutas
 */
const permissions = {
  // Autenticación básica
  authenticated: requirePermissions(['auth.login']),
  
  // Empresas
  canCreateCompany: requirePermissions(['companies.create']),
  canReadCompany: requirePermissions(['companies.read']),
  canUpdateCompany: requirePermissions(['companies.update']),
  canVerifyCompany: requirePermissions(['companies.verify']),
  
  // Documentos
  canUploadDocument: requirePermissions(['uploads.create']),
  canReadDocument: requirePermissions(['uploads.read']),
  
  // Usuarios
  canManageUsers: requirePermissions(['users.create', 'users.update', 'users.delete']),
  canReadUsers: requirePermissions(['users.read']),
  
  // Cálculos y certificados
  canCalculateEmissions: requirePermissions(['calculations.read']),
  canExportReports: requirePermissions(['calculations.export']),
  canCreateCertificate: requirePermissions(['certificates.create']),
  canReadCertificate: requirePermissions(['certificates.read']),
  
  // Pagos
  canProcessPayment: requirePermissions(['payments.create']),
  canReadPayment: requirePermissions(['payments.read']),
  
  // Admin
  canAccessAdmin: requirePermissions(['admin.system']),
  canViewAudit: requirePermissions(['admin.audit']),
  canManageCatalogs: requirePermissions(['admin.catalogs'])
};



/**
 * Helper: Sugerencias para completar onboarding
 */
const getOnboardingSuggestions = (status) => {
  const suggestions = {
    'registered': [
      'Complete la carga de documentos requeridos',
      'Verifique los dominios corporativos',
      'Espere la revisión del equipo'
    ],
    'pending_contract': [
      'Revise el contrato enviado por email',
      'Firme y envíe el contrato al equipo comercial'
    ],
    'signed': [
      'Su empresa está en proceso de activación final',
      'Recibirá notificación cuando esté activa'
    ],
    'suspended': [
      'Contacte al equipo de soporte',
      'Revise la documentación pendiente'
    ]
  };

  return suggestions[status] || ['Contacte al equipo de soporte'];
};

module.exports = {
  // Funciones principales
  requirePermissions,
  requireRole,
  requireCompanyAdmin,
  checkResourcePermission,
  
  // Helpers
  checkIfSuperAdmin,
  getUserPermissions,
  getUserRoles,
  
  // Shortcuts
  permissions,
  
  // Backwards compatibility con tu código actual
  checkPermission: requirePermissions,
  checkRole: requireRole
};