/**
 * 
 * Rutas para dashboards y métricas de onboarding
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

// Controllers
const dashboardController = require('../controllers/dashboardController');

// Middleware
const { requirePermissions } = require('../../auth/middleware/rbac');
const { checkCompanyAccess } = require('../middleware/companyAccess');

const router = express.Router();

// Rate limiting para dashboards
const dashboardRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 requests por minuto
  message: {
    success: false,
    message: 'Demasiadas consultas al dashboard, intenta nuevamente en 1 minuto'
  }
});

// Aplicar rate limiting a todas las rutas de dashboard
router.use(dashboardRateLimit);

// ==========================================
// DASHBOARDS DE EMPRESA
// ==========================================

/**
 * Dashboard completo de empresa
 * GET /api/onboard/dashboard/company/:id
 * Permisos: companies.read + acceso a la empresa
 */
router.get('/company/:id',
  requirePermissions(['companies.read']),
  checkCompanyAccess,
  dashboardController.getCompanyDashboard
);

/**
 * Progreso detallado de onboarding
 * GET /api/onboard/dashboard/progress/:id
 * Permisos: companies.read + acceso a la empresa
 */
router.get('/progress/:id',
  requirePermissions(['companies.read']),
  checkCompanyAccess,
  dashboardController.getOnboardingProgress
);

/**
 * Timeline de eventos de empresa
 * GET /api/onboard/dashboard/timeline/:id
 * Permisos: companies.read + acceso a la empresa
 */
router.get('/timeline/:id',
  requirePermissions(['companies.read']),
  checkCompanyAccess,
  async (req, res) => {
    try {
      const timeline = await dashboardController.getCompanyTimeline(req.params.id);
      res.json({
        success: true,
        data: timeline
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo timeline'
      });
    }
  }
);


/**
 * Dashboard administrativo general
 * GET /api/onboard/dashboard/admin
 * Permisos: admin.system
 */
router.get('/admin',
  requirePermissions(['admin.system']),
  dashboardController.getAdminDashboard
);

module.exports = router;