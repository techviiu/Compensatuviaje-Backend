const requireCompanyContext = (req, res, next) => {
  // El usuario debe estar autenticado (viene del middleware authenticate)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  // El usuario debe tener company_id
  if (!req.user.company_id) {
    return res.status(403).json({
      success: false,
      message: 'Este endpoint requiere contexto de empresa',
      code: 'COMPANY_CONTEXT_REQUIRED'
    });
  }

  next();
};

module.exports = { requireCompanyContext };
