/**
 * B2B - Rutas de Documentos de MI empresa
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const documentController = require('../../onboard/controllers/documentController');
const { requirePermissions } = require('../../auth/middleware/rbac');

const router = express.Router();

// Rate limiting
const uploadRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Demasiados uploads, intenta en 10 minutos'
  }
});

const downloadRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Demasiadas descargas, intenta en 1 minuto'
  }
});
/**
 * Listar documentos de mi empresa
 * GET /api/b2b/documents
 */
router.get('/',
  requirePermissions(['uploads.read']),
  documentController.listDocuments
);

router.post('/',
  uploadRateLimit,
  requirePermissions(['uploads.create']),
  documentController.uploadDocument,
  documentController.handleMulterError
);

router.get('/validation',
  requirePermissions(['uploads.read']),
  documentController.validateDocuments
);

router.get('/:id/download',
  downloadRateLimit,
  requirePermissions(['uploads.read']),
  documentController.downloadDocument
);

router.delete('/:id',
  requirePermissions(['uploads.create']),
  documentController.deleteDocument
);

module.exports = router;
