/**
 * Rutas para gestión de documentos legales
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

// Controllers
const documentController = require('../controllers/documentController');

// Middleware
const { requirePermissions } = require('../../auth/middleware/rbac');
const { checkCompanyAccess } = require('../middleware/companyAccess');

const router = express.Router();

// Rate limiting para uploads
const uploadRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 20, // máximo 20 uploads por ventana
  message: {
    success: false,
    message: 'Demasiados uploads, intenta nuevamente en 10 minutos'
  }
});

// Rate limiting para downloads
const downloadRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 downloads por minuto
  message: {
    success: false,
    message: 'Demasiadas descargas, intenta nuevamente en 1 minuto'
  }
});

// ==========================================
// RUTAS DE DOCUMENTOS POR EMPRESA
// ==========================================

/**
 * Subir documento para empresa
 * POST /api/onboard/companies/:id/documents
 * Permisos: uploads.create + acceso a la empresa
 */
router.post('/:id/documents',
  uploadRateLimit,
  requirePermissions(['uploads.create']),
  checkCompanyAccess,
  documentController.uploadDocument,
  documentController.handleMulterError
);

/**
 * Listar documentos de empresa
 * GET /api/onboard/companies/:id/documents
 * Permisos: uploads.read + acceso a la empresa
 */
router.get('/:id/documents',
  requirePermissions(['uploads.read']),
  checkCompanyAccess,
  documentController.listDocuments
);

/**
 * Validar set completo de documentos
 * GET /api/onboard/companies/:id/documents/validation
 * Permisos: uploads.read + acceso a la empresa
 */
router.get('/:id/documents/validation',
  requirePermissions(['uploads.read']),
  checkCompanyAccess,
  documentController.validateDocuments
);

// ==========================================
// RUTAS DE DOCUMENTOS INDIVIDUALES
// ==========================================

/**
 * Descargar documento
 * GET /api/onboard/documents/:id/download
 * Permisos: uploads.read + acceso al documento
 */
router.get('/:id/download',
  downloadRateLimit,
  requirePermissions(['uploads.read']),
  // TODO: Agregar middleware para verificar acceso al documento específico
  documentController.downloadDocument
);

/**
 * Eliminar documento
 * DELETE /api/onboard/documents/:id
 * Permisos: uploads.create + acceso al documento
 */
router.delete('/:id',
  requirePermissions(['uploads.create']),
  // TODO: Agregar middleware para verificar acceso al documento específico
  documentController.deleteDocument
);

// ==========================================
// RUTAS DE CONFIGURACIÓN
// ==========================================

/**
 * Obtener configuración de tipos de documentos
 * GET /api/onboard/document-config
 * Público para usuarios autenticados
 */
router.get('/config',
  documentController.getDocumentConfig
);

module.exports = router;