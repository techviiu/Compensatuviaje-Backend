/**
 * Middleware para inyectar company_id del contexto de usuario
 * 
 * Uso: En rutas B2B donde el controller espera req.params.id
 *      pero la empresa se determina por el usuario autenticado
 */

const injectCompanyId = (req, res, next) => {
  // Si no hay params.id pero hay user.company_id, inyectarlo
  if (!req.params.id && req.user?.company_id) {
    req.params.id = req.user.company_id;
  }
  next();
};

module.exports = { injectCompanyId };
