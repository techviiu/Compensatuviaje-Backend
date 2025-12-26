const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Importar el nuevo controlador de admin companies
const {
  listCompanies,
  getCompanyDetail,
  changeCompanyStatus,
  getCompanyDocuments,
  reviewDocument,
  getCompanyTimeline,
  getCompaniesStats
} = require('../controllers/adminCompaniesController');

// Rate limiter para cambios de estado
const statusChangeRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Demasiados cambios de estado, intenta en 5 minutos'
  }
});

/**
 * @route GET /api/admin/companies/stats
 * @desc Estadísticas globales de empresas B2B
 * @access SuperAdmin
 */
router.get('/stats', getCompaniesStats);

/**
 * @route GET /api/admin/companies
 * @desc Lista paginada de empresas con filtros
 * @access SuperAdmin
 * @query page, limit, search, status, sortBy, sortOrder
 */
router.get('/', listCompanies);

/**
 * @route GET /api/admin/companies/:id
 * @desc Detalle completo de una empresa
 * @access SuperAdmin
 */
router.get('/:id', getCompanyDetail);

/**
 * @route PUT /api/admin/companies/:id/status
 * @desc Cambiar estado de una empresa
 * @access SuperAdmin
 * @body { status, reason }
 */
router.put('/:id/status',
  statusChangeRateLimit,
  changeCompanyStatus
);

/**
 * @route GET /api/admin/companies/:id/documents
 * @desc Obtener documentos de verificación de una empresa
 * @access SuperAdmin
 */
router.get('/:id/documents', getCompanyDocuments);

/**
 * @route PUT /api/admin/companies/:id/documents/:documentId/review
 * @desc Revisar/aprobar documento de verificación
 * @access SuperAdmin
 * @body { status, notes }
 */
router.put('/:id/documents/:documentId/review', reviewDocument);

/**
 * @route GET /api/admin/companies/:id/timeline
 * @desc Obtener timeline de eventos de verificación
 * @access SuperAdmin
 */
router.get('/:id/timeline', getCompanyTimeline);

module.exports = router;
