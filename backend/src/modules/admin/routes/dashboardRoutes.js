const express = require('express');
const rateLimit = require('express-rate-limit');
const dashboardController = require('../../onboard/controllers/dashboardController');

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
 * Dashboard administrativo general
 * GET /api/admin/dashboard
 */
router.get('/', dashboardController.getAdminDashboard);

/**
 * Dashboard de empresa específica (admin)
 * GET /api/admin/dashboard/company/:id
 */
router.get('/company/:id', dashboardController.getCompanyDashboard);

module.exports = router;
