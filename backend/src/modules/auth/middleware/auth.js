/**
 * inteceptamos todas la request  a rutas protegidas
 * tambien nos serviran par validar los token JWT que está en el 
 * header Authorization.
 * Decodificaremos la info de user desde el token
 * Inyectamreos requests para uso en el controller
 * Bloque acceso si el token es inválido/expirado
 * 
 * 
 */

const tokenService = require('../services/tokenService');
const authService = require('../services/authService');
const logger = require('../../../utils/logger');
const { decode } = require('jsonwebtoken');

const ACTIVE_COMPANY_REQUIRED_PATHS = [
  '/api/upload',           // Carga de manifiestos
  '/api/calc',             // Cálculos de emisiones
  '/api/certificates',     // Generación de certificados
  '/api/payments',         // Procesamiento de pagos
  '/api/reports'           // Exportación de reportes
];


const ONBOARDING_ALLOWED_PATHS = [
  '/api/auth',             // Autenticación
  '/api/onboard',          // Proceso de onboarding
  '/health',               // Health check
  '/api/info'              // Información de API
];

const authMiddleware = async (req, res, next) =>{
  const startTime = Date.now();
  try {
    // Extraermos el token del header Authorization
    const authHeader  = req.headers.authorization;
    
    if(!authHeader){
      logger.warn('Missing authorization header', {
        path: req.path,
        method: req.method,
        //ip: req.ip
      });
      return res.status(401).json({
        success: false,
        error_code: 'MISSING_TOKEN',
        error_message: 'Token de autorización requerido'
      });
    }

    // Verificamo el formato "Bearer <token>"
    const parts = authHeader.split(' ');

    if(parts.length !== 2 || parts[0] !== 'Bearer'){
          logger.warn('Invalid authorization header format', { 
        header: authHeader.substring(0, 20) + '...',
        ip: req.ip 
    });

    return res.status(401).json({
      success: false,
      error_code: 'INVALID_TOKEN_FORMAT',
      error_message: 'Formato de token inválido. Use: Bearer <token>'
    });
  }



  const token = parts[1];
  // validamos el token JWT
  const validation = tokenService.validateToken(token);

  if (!validation.valid) {
      if (validation.expired) {
        logger.warn('Expired token used', { 
          ip: req.ip,
          path: req.path 
        });
        
        return res.status(401).json({
          success: false,
          error_code: 'TOKEN_EXPIRED',
          error_message: 'Token expirado. Use refresh token para renovar.'
        });
      }

      logger.warn('Invalid token used', { 
        error: validation.error,
        ip: req.ip,
        path: req.path 
      });
      
      return res.status(401).json({
        success: false,
        error_code: 'INVALID_TOKEN',
        error_message: 'Token inválido'
      });
    }

    const decoded = validation.decoded;

    if(decoded.token_type !== 'access'){
      logger.warn('Wrong token type used', { 
        token_type: decoded.token_type,
        ip: req.ip 
      });
      
      return res.status(401).json({
        success: false,
        error_code: 'WRONG_TOKEN_TYPE',
        error_message: 'Debe usar un access token'
      });
    }

    // Verificamos que el usuario existe
    const userExists = await authService.getUserById(decoded.user_id);

    if (!userExists) {
      logger.warn('Token for non-existent user', {
        user_id: decoded.user_id,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        error_code: 'USER_NOT_FOUND',
        error_message: 'Usuario no encontrado'
      });
    }
  

    let companyUser = null;
    let company = null;

    if (decoded.company_id) {
      // Buscamos la relación usuario-empresa
      companyUser = userExists.companyUsers.find(cu => cu.company.id === decoded.company_id);
      
      if (companyUser) {
        company = companyUser.company;
        
        // Verificar que el CompanyUser esté activo
        if (companyUser.status !== 'active') {
          logger.warn('Inactive CompanyUser attempting access', {
            user_id: decoded.user_id,
            company_id: decoded.company_id,
            companyUser_status: companyUser.status,
            ip: req.ip
          });

          return res.status(403).json({
            success: false,
            error_code: 'USER_INACTIVE_IN_COMPANY',
            error_message: 'Tu cuenta está inactiva en esta empresa. Contacta al administrador.'
          });
        }

        // Verificar si la empresa está suspendida (bloquea TODO acceso)
        if (company.status === 'suspended') {
          logger.warn('Access attempt from suspended company', {
            user_id: decoded.user_id,
            company_id: decoded.company_id,
            company_status: company.status,
            ip: req.ip
          });

          return res.status(403).json({
            success: false,
            error_code: 'COMPANY_SUSPENDED',
            error_message: 'Empresa suspendida. Contacte al equipo de CompensaTuViaje.'
          });
        }
      }
    }

    // SuperAdmin bypass (no requiere empresa)
    const isSuperAdmin = await checkIfSuperAdmin(decoded.user_id);
    console.log("👌esto lo que tengo en superAdmin", isSuperAdmin, "ID:", decoded.user_id)
    if (!isSuperAdmin && !companyUser) {
      logger.warn('Token for user without company access', {
        user_id: decoded.user_id,
        company_id: decoded.company_id,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error_code: 'COMPANY_ACCESS_DENIED',
        error_message: ' ❌No tienes acceso a esta empresa'
      });
    }
    // Verificar si la ruta requiere empresa activa
    const requiresActiveCompany = ACTIVE_COMPANY_REQUIRED_PATHS.some(path => 
      req.path.startsWith(path)
    );

    const isOnboardingPath = ONBOARDING_ALLOWED_PATHS.some(path => 
      req.path.startsWith(path)
    );

    // BLOQUEAR rutas operacionales críticas si la empresa NO está activa
    if (!isSuperAdmin && requiresActiveCompany && company?.status !== 'active') {
      logger.warn('Access denied - inactive company for operational endpoint', {
        user_id: decoded.user_id,
        company_id: decoded.company_id,
        company_status: company?.status,
        path: req.path,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error_code: 'COMPANY_NOT_ACTIVE',
        error_message: `Esta operación requiere que la empresa esté activa. Estado actual: '${company?.status}'. Complete el proceso de onboarding.`,
        company_status: company?.status,
        next_steps: getNextStepsForStatus(company?.status)
      });
    }


 

    req.user = {
      id: decoded.user_id,
      user_id: decoded.user_id,
      email: decoded.email,
      company_id: decoded.company_id,
      companyId: decoded.company_id,
      role: decoded.role,
      permissions: decoded.permissions || [],
      global_roles: userExists.globalRoles || [],
      is_admin: companyUser?.isAdmin || false,
      isSuperAdmin,
      company: company ? {
        id: company.id,
        status: company.status,
        razonSocial: company.razonSocial,
        slug: company.slug
      } : null,
      last_activity: new Date().toISOString()
    };
    // logs de acceso existoso 
        if (process.env.LOG_LEVEL === 'debug') {
      const duration = Date.now() - startTime;
      logger.debug('Authentication successful', {
        user_id: req.user.user_id,
        company_id: req.user.company_id,
        path: req.path,
        method: req.method,
        duration_ms: duration
      });
    }

    next()
  } catch (error) {
        const duration = Date.now() - startTime;
    
    logger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      duration_ms: duration
    });

    res.status(500).json({
      success: false,
      error_code: 'AUTH_SYSTEM_ERROR',
      error_message: 'Error interno de autenticación'
    });
  } 
}


/**
 *  endpoint publicos que muestran mas info si esta autenticado
 */

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Si no hay header, continuar sin autenticación
    if (!authHeader) {
      req.user = null;
      return next();
    }

    // Intentar autenticación pero no fallar si es inválida
    const parts = authHeader.split(' ');
    
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const validation = tokenService.validateToken(token);
      
      if (validation.valid && validation.decoded.token_type === 'access') {
        const userExists = await authService.getUserById(validation.decoded.user_id);
        
        if (userExists) {
          const companyUser = userExists.companyUsers.find(
            cu => cu.company.id === validation.decoded.company_id
          );
          
          if (companyUser) {
            const isSuperAdmin = await checkIfSuperAdmin(validation.decoded.user_id);
            
            req.user = {
              id: validation.decoded.user_id,
              user_id: validation.decoded.user_id,
              email: validation.decoded.email,
              company_id: validation.decoded.company_id,
              role: validation.decoded.role,
              permissions: validation.decoded.permissions || [],
              global_roles: userExists.globalRoles || [],
              is_admin: companyUser.isAdmin,
              isSuperAdmin,
              company: {
                id: companyUser.company.id,
                status: companyUser.company.status,
                razonSocial: companyUser.company.razonSocial
              }
            };
          }
        }
      }
    }

    // Si no se pudo autenticar, req.user = null
    if (!req.user) {
      req.user = null;
    }

    next();

  } catch (error) {
    logger.warn('Optional auth middleware error', {
      error: error.message,
      path: req.path,
      ip: req.ip
    });
    
    req.user = null;
    next();
  }
};

const checkIfSuperAdmin = async (userId) => {
  try {
    const user = await authService.getUserById(userId);
    const superAdminEmail = process.env.FIRST_SUPER_ADMIN_EMAIL || 'admin@compensatuviaje.com';
    return user?.email === superAdminEmail;
  } catch (error) {
    logger.error('Error checking SuperAdmin', { error: error.message, userId });
    return false;
  }
};

const getNextStepsForStatus = (status) => {
  const steps = {
    'registered': [
      'Completar carga de documentos requeridos',
      'Verificar dominios corporativos',
      'Esperar revisión del equipo CompensaTuViaje'
    ],
    'pending_contract': [
      'Revisar y firmar contrato enviado por email',
      'Enviar contrato firmado al equipo comercial'
    ],
    'signed': [
      'Esperar activación final del equipo técnico',
      'Recibirás notificación por email cuando esté listo'
    ],
    'suspended': [
      'Contactar al equipo de soporte para reactivación',
      'Revisar y corregir documentación si es necesario'
    ]
  };

  return steps[status] || ['Contactar soporte técnico'];
};



/**
 * Middleware que requiere empresa activa específicamente
 * Para endpoints que absolutamente necesitan empresa operacional
 */
const requireActiveCompany = (req, res, next) => {
  if (req.user?.isSuperAdmin) {
    return next(); // SuperAdmin bypass
  }

  if (!req.user?.company || req.user.company.status !== 'active') {
    logger.warn('Active company required', {
      user_id: req.user?.user_id,
      company_id: req.user?.company_id,
      company_status: req.user?.company?.status,
      path: req.path,
      ip: req.ip
    });

    return res.status(403).json({
      success: false,
      error_code: 'ACTIVE_COMPANY_REQUIRED',
      error_message: 'Esta operación requiere que la empresa esté activa',
      company_status: req.user?.company?.status,
      next_steps: getNextStepsForStatus(req.user?.company?.status)
    });
  }

  next();
};


/**
 * Middleware de extracción de empresa
 * 
 * GET /api/companies/:companyId/flights
 * 
 *  MVP SIMPLIFICADO: Usuario solo accede a su empresa
 *  MVP REAL: Verificar permisos cross-company para consultores/auditores
 */


/**
 * Middleware de extracción de empresa
 * Ahora con soporte para empresas en proceso de onboarding
 */
const extractCompanyMiddleware = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        error_code: 'MISSING_COMPANY_ID',
        error_message: 'ID de empresa requerido'
      });
    }

    // SuperAdmin puede acceder a cualquier empresa
    if (req.user?.isSuperAdmin) {
      req.targetCompany = companyId;
      return next();
    }

    // Verificar que pertenece a su empresa
    if (req.user?.company_id !== companyId) {
      logger.warn('Cross-company access attempt', {
        user_id: req.user?.user_id,
        user_company: req.user?.company_id,
        requested_company: companyId,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error_code: 'COMPANY_ACCESS_DENIED',
        error_message: 'No tienes acceso a esta empresa'
      });
    }

    req.targetCompany = companyId;
    next();

  } catch (error) {
    logger.error('Extract company middleware error', {
      error: error.message,
      user_id: req.user?.user_id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error_code: 'SYSTEM_ERROR',
      error_message: 'Error interno del sistema'
    });
  }
};

module.exports = { authMiddleware, authenticate: authMiddleware, optionalAuthMiddleware, extractCompanyMiddleware };
