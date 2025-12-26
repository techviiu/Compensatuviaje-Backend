const express = require('express');
const rateLimit = require('express-rate-limit');
const dashboardController = require('../../onboard/controllers/dashboardController');
const adminDashboardController = require('../controllers/adminDashboardController');

const router = express.Router();

// Rate limiting
const dashboardRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Demasiadas consultas, intenta en 1 minuto'
  }
});

router.use(dashboardRateLimit);

/**
 * Dashboard administrativo general con métricas completas
 * GET /api/admin/dashboard
 */
router.get('/', adminDashboardController.getDashboard);

/**
 * Métricas por período para gráficos
 * GET /api/admin/dashboard/metrics
 */
router.get('/metrics', adminDashboardController.getMetrics);

/**
 * Estadísticas detalladas de empresas
 * GET /api/admin/dashboard/companies-stats
 */
router.get('/companies-stats', adminDashboardController.getCompaniesStats);

/**
 * Dashboard de empresa específica (admin)
 * GET /api/admin/dashboard/company/:id
 */
router.get('/company/:id', dashboardController.getCompanyDashboard);

module.exports = router;
