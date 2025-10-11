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

    // Verificamos que el usuario existe y que ademas eeste activo en BD, pero eso no tdavía
    const userExists = await authService.getUserById(decoded.user_id);

    if(!userExists){
      logger.warn('token for non-existent or inactive user', {
        user_id: decoded.user_id,
        ip: req.ip
      })

      return res.status(401).json({
        success: false,
        error_code: 'USERT_NOT_FOUND',
        error_message: 'Usuario no econtrado o inactivo'
      });
    }

    // Verificamos que la empresa al que pertence esté activa
    const activeCompany = userExists.companyUsers.find(cu => cu.company.id === decoded.company_id && cu.company.status === 'ACTIVE');

    if(!activeCompany){
      logger.warn('Token for inactive company', {
        user_id: decode.user.id,
        comapny_id: decode.company_id,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error_code: 'COMPANY_INACTIVE',
        error_message: 'Empresa asociada está inactivo'
      });
    }

    // inyectamos en el request, mas exactamente en el req.user para contollerss
    req.user = {
      user_id: decoded.userd_id,
      email: decoded.email,
      comapany_id: decoded.comapny_id,
      role: decoded.role,
      permissions: decoded.permissions || [],
      is_admin: activeCompany.isAdmin,
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

    // aquie faltaria: 1: Actualizar última actividad del usuario
    // 2: Verificar límites de sesiones concurrentes
    // 3: Detectar comportamiento sospechoso
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
          const activeCompany = userExists.companyUsers.find(
            cu => cu.company.id === validation.decoded.company_id && cu.company.status === 'ACTIVE'
          );
          
          if (activeCompany) {
            req.user = {
              user_id: validation.decoded.user_id,
              email: validation.decoded.email,
              company_id: validation.decoded.company_id,
              role: validation.decoded.role,
              permissions: validation.decoded.permissions || [],
              is_admin: activeCompany.isAdmin
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
    // En caso de error, continuar sin autenticación
    logger.warn('Optional auth middleware error', {
      error: error.message,
      path: req.path,
      ip: req.ip
    });
    
    req.user = null;
    next();
  }
};

/**
 * Middleware de extracción de empresa
 * 
 * GET /api/companies/:companyId/flights
 * 
 *  MVP SIMPLIFICADO: Usuario solo accede a su empresa
 *  MVP REAL: Verificar permisos cross-company para consultores/auditores
 */


const extractCompanyMiddleware = async (req, res, next) =>{
  try {
    const {companyId}  = req.params;
    if(!companyId){
      return res.status(400).json({
        success: false,
        error_code: 'MISSING_COMPANY_ID',
        error_message: 'ID de empresa requerido'
      })
    }

    // verificamos que pertence a su empresa
    if(req.user.company_id !== companyId){
      logger.warn('Cross-company access attempt',{
        user_id: req.user.user_id,
        user_company: req.user.company_id,
        requested_company: companyId,
        ip: req.ip
      })

      return res.status(403).json({
        success: false,
        error_code: 'COMPANY_ACCESS_DENIED',
        error_message: 'No tine acceso a esta empresa'
      });
    }

    // par el MVP real abira rabcService integrado para dar permisos suficientes a dicho rol
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
module.exports = { authMiddleware, authenticate: authMiddleware, optionalAuthMiddleware, extractCompanyMiddleware };
