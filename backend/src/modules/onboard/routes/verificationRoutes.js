/**
 * Rutas para verificación de dominios y validaciones administrativas
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

// Controllers
const verificationController = require('../controllers/verificationController');

// Middleware
const { requirePermissions } = require('../../auth/middleware/rbac');
const { checkCompanyAccess } = require('../middleware/companyAccess');

const router = express.Router();

// Rate limiting para validaciones
const validationRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 50, // máximo 50 validaciones por minuto
  message: {
    success: false,
    message: 'Demasiadas validaciones, intenta nuevamente en 1 minuto'
  }
});

// Rate limiting para verificaciones admin
const adminVerificationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // máximo 20 verificaciones por ventana
  message: {
    success: false,
    message: 'Demasiadas verificaciones, intenta nuevamente en 5 minutos'
  }
});

// ==========================================
// RUTAS DE DOMINIOS POR EMPRESA
// ==========================================

/**
 * Agregar dominio corporativo
 * POST /api/onboard/companies/:id/domains
 * Permisos: companies.update + acceso a la empresa
 */
router.post('/:id/domains',
  requirePermissions(['companies.update']),
  checkCompanyAccess,
  verificationController.addDomain
);

/**
 * Listar dominios de empresa
 * GET /api/onboard/companies/:id/domains
 * Permisos: companies.read + acceso a la empresa
 */
router.get('/:id/domains',
  requirePermissions(['companies.read']),
  checkCompanyAccess,
  verificationController.listCompanyDomains
);

// ==========================================
// RUTAS ADMINISTRATIVAS DE VERIFICACIÓN
// ==========================================

/**
 * Obtener verificaciones pendientes (admin)
 * GET /api/onboard/admin/verification/pending
 * Permisos: admin.system
 */
router.get('/pending',
  requirePermissions(['admin.system']),
  verificationController.getPendingVerifications
);

/**
 * Obtener estadísticas de verificación (admin)
 * GET /api/onboard/admin/verification/stats
 * Permisos: admin.system
 */
router.get('/stats',
  requirePermissions(['admin.system']),
  verificationController.getVerificationStats
);

/**
 * Verificar dominio manualmente (admin)
 * PUT /api/onboard/domains/:id/verify
 * Permisos: companies.verify (solo SuperAdmin)
 */
router.put('/domains/:id/verify',
  adminVerificationRateLimit,
  requirePermissions(['companies.verify']),
  verificationController.verifyDomain
);

// ==========================================
// RUTAS DE VALIDACIÓN PÚBLICA
// ==========================================

/**
 * Validar código de aeropuerto
 * POST /api/onboard/validate/airport-code
 * Permisos: auth.login (cualquier usuario autenticado)
 */
router.post('/airport-code',
  validationRateLimit,
  requirePermissions(['auth.login']),
  verificationController.validateAirportCode
);

/**
 * Validar email corporativo
 * POST /api/onboard/validate/corporate-email
 * Permisos: companies.read + acceso a la empresa del email
 */
router.post('/corporate-email',
  validationRateLimit,
  requirePermissions(['companies.read']),
  verificationController.validateCorporateEmail
);

/**
 * Obtener información de dominio
 * GET /api/onboard/domain-info/:domain
 * Permisos: auth.login (cualquier usuario autenticado)
 */
router.get('/domain-info/:domain',
  validationRateLimit,
  requirePermissions(['auth.login']),
  verificationController.getDomainInfo
);

module.exports = router;