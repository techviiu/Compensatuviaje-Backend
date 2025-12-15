const jwt = require('jsonwebtoken');

/**
 * Identifica el tipo de usuario según el token
 */
const identifyUserType = async (req, res, next) => {
  // Inicializar contexto
  req.userType = 'anonymous';
  req.userContext = null;

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  try {
    // Intentar decodificar como JWT propio (B2B/Admin)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded) {
      // Verificar si es SuperAdmin
      if (decoded.global_roles?.some(gr => gr.role?.name === 'super_admin')) {
        req.userType = 'admin';
      }
      // Verificar si es Partner (TODO: implementar lógica)
      else if (decoded.partner_id) {
        req.userType = 'partner';
      }
      // Verificar si es B2B (tiene company_id)
      else if (decoded.company_id) {
        req.userType = 'b2b';
      }
      
      req.userContext = decoded;
    }
  } catch (jwtError) {
    req.userType = 'anonymous';
  }

  next();
};

const logUserType = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Principal] ${req.method} ${req.path} - UserType: ${req.userType}`);
  }
  next();
};

module.exports = { 
  identifyUserType,
  logUserType
};
