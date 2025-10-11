/**
 * De esta manera controlaremos los roles y permisos
 * Verifica que cada usuaior tenga persmisos para cualquier accion
 * Loggin de intento de acceso denegado para seguridad
 * 
 */

const logger = require('../../../utils/logger');

/**
 * @param {string|string[]} requiredPermissions - Permisos requeridos
 * @param {object} iptions - Opciones adicinales
 * @returns {Function} Middleware function
 */

const checkPermission = (requiredPermissions, options = {})=>{
  return (req, res, next) =>{
    try {
      // 1️  Verificar que el usuario esté autenticado
      if(!req.user){
        logger.warn('RBAC check without authentication', {
          path: req.path,
          method: req.method,
          ip: req.ip
        })

        return res.status(401).json({
          success: false,
          error_code: 'AUTHENTICATION_REQUIRED',
          error_message: 'Debe iniciar sesión'
        })
      }

      //  2️ convertimos en array 
      const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];
      
      // 3️  Obtener permisos del usuario desde el token
      const userPermissions = req.user.permissions || [];
      
      // 4️ Verificar permisos 
            const strategy = options.strategy || 'any'; // 'any' | 'all'
      let hasPermission = false;

      if (strategy === 'all') {
        // Usuario debe tener TODOS los permisos requeridos
        hasPermission = permissions.every(perm => userPermissions.includes(perm));
      } else {
        // Usuario debe tener AL MENOS UNO de los permisos (por defecto)
        hasPermission = permissions.some(perm => userPermissions.includes(perm));
      }

      
      //  MVP REAL INCLUIRÍA VERIFICACIÓN DE SCOPE:
      // 5️ Verificar scope de permisos (global vs company)
      if (!hasPermission) {
        logger.warn('Permission denied', {
          user_id: req.user.user_id,
          company_id: req.user.company_id,
          required_permissions: permissions,
          user_permissions: userPermissions,
          path: req.path,
          method: req.method,
          ip: req.ip
        });

        //  MVP REAL INCLUIRÍA:
        // await securityService.recordUnauthorizedAccess({

        return res.status(403).json({
          success: false,
          error_code: 'INSUFFICIENT_PERMISSIONS',
          error_message: 'Permisos insuficientes para esta acción',
          required_permissions: permissions // Solo en desarrollo
        });
      }

      // 6️ log de acceso autoizado
      if(process.env.LOG_LEVEL == 'debug'){
        logger.debug('Permission granted', {
          user_id: req.user.user_id,
          permissions_checked: permissions,
          path: req.path,
          method: req.method
        })
      }

      next();

  
        
    } catch (error) {
       logger.error('RBAC middleware error', {
        error: error.message,
        user_id: req.user?.user_id,
        required_permissions: requiredPermissions,
        path: req.path,
        ip: req.ip
       });

       res.status(500).json({
        success: false,
        error_code: 'AUTHORIZATION_SYSTEM_ERROR',
        error_message: 'Error interno de autorización'
       });
    }
  };
};

/**
 * Verificamos los roles específicos
 * @param {string | string[]} requiredRoles - Roloes requeridos
 * @returns {Function} Middleware function
 */

const checkRole = (requiredRoles) =>{
  return (req, res, next)=>{
    try {
      if(!req.user){
        return res.status(401).json({
        success: false,
        error_code: 'AUTHENTICATION_REQUIRED',
        error_message: 'Debe iniciar sesión'
      });
      }

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      const userRole = req.user.role;
      // aqui sabremos si tiene el rol necesesario:
      if (!roles.includes(userRole)) {
        logger.warn('Role access denied', {
          user_id: req.user.user_id,
          user_role: userRole,
          required_roles: roles,
          path: req.path,
          method: req.method,
          ip: req.ip
        });
        return res.status(403).json({
          success: false,
          error_code: 'INSUFFICIENT_ROLE',
          error_message: `Requiere uno de los roles: ${roles.join(', ')}`,
          current_role: userRole
        });
      }
      next();

    } catch (error) {
      logger.error('Role check middleware error', {
             error: error.message,
        user_id: req.user?.user_id,
        path: req.path
      });

      res.status(500).json({
        success: false,
        error_code: 'SYSTEM_ERROR',
        error_message: 'Error interno del sistema'
      });
    }
  }
}

/**
 *  Verificar que es Admin de la empresa
 * 
 * Shortcut para verificar is_admin flag
 */
const requireCompanyAdmin = (req, res, next) =>{
  try {
    if(!req.user) {
      return res.status(401).json({
        success: false,
        error_code: 'AUTHENTICATION_REQUIRED',
        error_message: 'Debe iniciar sesión'
      });
    }

    // esto es clave
    if(!req.user.is_admin){
      logger.warn('Company admin required', {
        user_id: req.user.user_id,
        company_id: req.user.company_id,
        is_admin: req.user.is_admin,
        path: req.path,
        ip: req.ip
      })
      return res.status(403).json({
        success: false,
        error_code: 'COMPANY_ADMIN_REQUIRED',
        error_message:  'Requiere permisos de administrado de la empresa'
      });
    }
    next();
  } catch (error) {
    logger.error('Company admin middleware error', {
      error: error.message,
      user_id: req.user?.user_id
    });

    res.status(500).json({
      success: false,
      error_code: 'SYSTEM_ERROR',
      error_message: 'Error interno del sistema'
    });
  }
};

/**
 * Verificar Admin del Sistema (cross-company)
 * 
 * Solo para operaciones que afectan múltiples empresas
 */
const requireSystemAdmin = checkRole('admin_system');

/**
 *  Middleware dinámico de permisos basado en recurso
 * 
 *  MVP REAL: Permisos dinámicos según el recurso accedido
 */
const checkResourcePermission = (resourceType) => {
  return (req, res, next) => {
    try {
      // Mapeo dinámico de método HTTP a acción de permiso
      const actionMap = {
        'GET': 'view',
        'POST': 'create',
        'PUT': 'update',
        'PATCH': 'update',
        'DELETE': 'delete'
      };

      const action = actionMap[req.method] || 'access';
      const permission = `${action}_${resourceType}`; // ej: "view_manifests", "create_certificates"

      // Reutilizar checkPermission con el permiso dinámico
      return checkPermission([permission])(req, res, next);

    } catch (error) {
      logger.error('Resource permission middleware error', {
        error: error.message,
        resource_type: resourceType,
        method: req.method,
        path: req.path
      });

      res.status(500).json({
        success: false,
        error_code: 'SYSTEM_ERROR',
        error_message: 'Error interno del sistema'
      });
    }
  };
};

// MVP REAL INCLUIRÍA PERMISOS ESPECÍFICOS POR MÓDULO:
// Shortcuts comunes para los módulos principales
const permissions = {
  // Manifiestos y vuelos
  canUploadManifests: checkPermission(['upload_manifest']),
  canViewDashboard: checkPermission(['view_dashboard']),
  
  // Certificados
  canGenerateCertificates: checkPermission(['generate_certificate']),
  canRevokeCertificates: checkPermission(['revoke_certificate']),
  
  // Gestión de usuarios
  canManageUsers: checkPermission(['manage_company_users']),
  canViewAllData: checkPermission(['view_all_data']),
  
  // Configuración
  canConfigurePricing: checkPermission(['configure_pricing']),
  canManageProjects: checkPermission(['create_projects', 'manage_projects'], { strategy: 'any' }),
  
  // Moderación
  canModerateProfiles: checkPermission(['moderate_profiles']),
  
  // Recursos específicos
  manifests: checkResourcePermission('manifests'),
  certificates: checkResourcePermission('certificates'),
  companies: checkResourcePermission('companies'),
  projects: checkResourcePermission('projects')
};


module.exports = {
  checkPermission,
  checkRole,
  requireCompanyAdmin,
  requireSystemAdmin,
  checkResourcePermission,
  permissions
};