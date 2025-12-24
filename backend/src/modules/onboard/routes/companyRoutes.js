/**
 * Rutas para gestión de empresas en proceso de onboarding
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

const companyController = require('../controllers/companyController');

// Middleware
const { requirePermissions } = require('../../auth/middleware/rbac');

const router = express.Router();

// Rate limiting específico para operaciones sensibles
const statusChangeRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // máximo 10 cambios de estado por ventana
  message: {
    success: false,
    message: 'Demasiados cambios de estado, intenta nuevamente en 5 minutos'
  }
});

// ==========================================
// RUTAS PÚBLICAS (sin autenticación)
// ==========================================

/**
 * Registrar nueva empresa
 * POST /api/onboard/companies
 * Público - no requiere autenticación
 */
router.post('/', companyController.registerCompany);

// ==========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ==========================================

/**
 * Obtener empresa por ID
 * GET /api/onboard/companies/:id
 * Permisos: companies.read
 */
router.get('/:id', 
  requirePermissions(['companies.read']),
  companyController.getCompany
);

/**
 * Actualizar datos de empresa
 * PUT /api/onboard/companies/:id
 * Permisos: companies.update
 */
router.put('/:id',
  requirePermissions(['companies.update']),
  companyController.updateCompany
);

/**
 * Cambiar estado de empresa (solo admin)
 * PUT /api/onboard/companies/:id/status
 * Permisos: companies.verify (solo SuperAdmin)
 */
router.put('/:id/status',
  statusChangeRateLimit,
  requirePermissions(['companies.verify']),
  companyController.changeCompanyStatus
);

// ==========================================
// RUTAS ADMINISTRATIVAS
// ==========================================

/**
 * Listar todas las empresas (admin)
 * GET /api/onboard/companies
 * Permisos: admin.system
 * Se puede hacer filtros para company:
 * registered, pending_contract, signed, active, suspended
 */
router.get('/',
  requirePermissions(['admin.system']),
  companyController.listCompanies
);

/**
 * Obtener estadísticas de onboarding (admin)
 * GET /api/onboard/companies/stats
 * Permisos: admin.system
 */
router.get('/get/stats',
  requirePermissions(['admin.system']),
  companyController.getOnboardingStats
);

module.exports = router;