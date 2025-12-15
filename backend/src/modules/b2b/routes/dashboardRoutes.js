const express = require('express');
const rateLimit = require('express-rate-limit');
const dashboardController = require('../../onboard/controllers/dashboardController');
const { requirePermissions } = require('../../auth/middleware/rbac');

const router = express.Router();

// Rate limiting para dashboards
const dashboardRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Demasiadas consultas al dashboard, intenta en 1 minuto'
  }
});

router.use(dashboardRateLimit);
/**
 * Dashboard completo de mi empresa
 * GET /api/b2b/dashboard
 */
router.get('/',
  requirePermissions(['companies.read']),
  dashboardController.getCompanyDashboard
);
router.get('/progress',
  requirePermissions(['companies.read']),
  dashboardController.getOnboardingProgress
);

router.get('/timeline',
  requirePermissions(['companies.read']),
  async (req, res) => {
    try {
      const timeline = await dashboardController.getCompanyTimeline(req.user.company_id);
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

module.exports = router;
