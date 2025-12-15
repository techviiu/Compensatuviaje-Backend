const requireSuperAdmin = (req, res, next) => {
  // El usuario debe estar autenticado
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  // Verificar si tiene rol global de SuperAdmin
  const isSuperAdmin = req.user.global_roles?.some(
    gr => gr.role?.name === 'super_admin'
  );

  if (!isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Se requiere rol de SuperAdmin',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }

  next();
};

module.exports = { requireSuperAdmin };
