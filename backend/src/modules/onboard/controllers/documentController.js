/**
 * endpoints
 * POST /api/onboard/companies/:id/documents - Subir documento
 * GET /api/onboard/companies/:id/documents - Listar documentos
 * GET /api/onboard/documents/:id/download - Descargar documento
 * DELETE /api/onboard/documents/:id - Eliminar documento
 * GET /api/onboard/companies/:id/documents/validation - Validar set documentos
 */

const multer = require('multer');
const documentService = require('../services/documentService');
const {validateDocumentUpload, handleValidationErrors}  = require('../validators/onboardValidator');


const {multerFileFilter, DOCUMENT_CONFIG} = require('../validators/documentValidator');
const logger  = require('../../../utils/logger');

// Configuración Multer para upload en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: DOCUMENT_CONFIG.maxFileSize,
    files: 1
  },
  fileFilter: multerFileFilter
});

/**
 * Subir documento para empresa
 * POST /api/onboard/companies/:id/documents
 */
const uploadDocument = [
  // Upload middleware
  upload.single('file'),
  
  // Validaciones
  ...validateDocumentUpload,
  handleValidationErrors,
  
  // Controller
  async (req, res) => {
    try {
      const { id: companyId } = req.params;
      const { docType, description } = req.body;
      const file = req.file;
      const userId = req.user.id;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Archivo requerido'
        });
      }

      // Subir documento
      const result = await documentService.uploadDocument(
        companyId,
        file,
        docType,
        userId,
        description
      );

      res.status(201).json({
        success: true,
        message: 'Documento subido exitosamente',
        data: {
          document: {
            id: result.document.id,
            docType: result.document.docType,
            status: result.document.status,
            uploadedAt: result.document.uploadedAt
          },
          file: {
            id: result.file.id,
            fileName: result.file.fileName,
            mimeType: result.file.mimeType,
            sizeBytes: result.file.sizeBytes
          },
          metadata: result.metadata
        }
      });

    } catch (error) {
      logger.error('Error subiendo documento', { 
        error: error.message,
        companyId: req.params.id,
        docType: req.body.docType
      });

      if (error.message.includes('Archivo inválido')) {
        return res.status(400).json({
          success: false,
          message: 'Archivo inválido',
          error: error.message
        });
      }

      if (error.message === 'Empresa no encontrada') {
        return res.status(404).json({
          success: false,
          message: 'Empresa no encontrada'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
];


/**
 * Listar documentos de empresa
 * GET /api/onboard/companies/:id/documents
 */

const listDocuments = async (req, res) => {
  try {
    const { id: companyId } = req.params;
    const { docType } = req.query;

    const documents = await documentService.getCompanyDocuments(companyId, docType);

    // Formatear respuesta
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      docType: doc.docType,
      status: doc.status,
      uploadedAt: doc.uploadedAt,
      file: {
        id: doc.file.id,
        fileName: doc.file.fileName,
        mimeType: doc.file.mimeType,
        sizeBytes: doc.file.sizeBytes,
        checksum: doc.file.checksum
      }
    }));

    res.json({
      success: true,
      data: formattedDocuments,
      count: formattedDocuments.length,
      documentTypes: DOCUMENT_CONFIG.documentTypes
    });

  } catch (error) {
    logger.error('Error listando documentos', { 
      error: error.message,
      companyId: req.params.id 
    });

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Descargar documento
 * GET /api/onboard/documents/:id/download
 */
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const fileInfo = await documentService.downloadDocument(id, userId);

    // Configurar headers para descarga
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Length', fileInfo.size);
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);

    // Enviar archivo
    res.sendFile(fileInfo.filePath);

  } catch (error) {
    logger.error('Error descargando documento', { 
      error: error.message,
      documentId: req.params.id 
    });

    if (error.message === 'Documento no encontrado') {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    if (error.message === 'Archivo no encontrado en storage') {
      return res.status(410).json({
        success: false,
        message: 'Archivo no disponible'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar documento
 * DELETE /api/onboard/documents/:id
 */
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await documentService.deleteDocument(id, userId);

    res.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });

  } catch (error) {
    logger.error('Error eliminando documento', { 
      error: error.message,
      documentId: req.params.id 
    });

    if (error.message === 'Documento no encontrado') {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};


/**
 * Validar set completo de documentos
 * GET /api/onboard/companies/:id/documents/validation
 */
const validateDocuments = async (req, res) => {
  try {
    const { id: companyId } = req.params;

    const validation = await documentService.validateCompanyDocuments(companyId);

    res.json({
      success: true,
      data: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        documentSummary: validation.documentSummary,
        completionPercentage: calculateCompletionPercentage(validation.documentSummary)
      }
    });

  } catch (error) {
    logger.error('Error validando documentos', { 
      error: error.message,
      companyId: req.params.id 
    });

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener configuración de tipos de documentos
 * GET /api/onboard/document-config
 */
const getDocumentConfig = (req, res) => {
  res.json({
    success: true,
    data: {
      documentTypes: DOCUMENT_CONFIG.documentTypes,
      maxFileSize: DOCUMENT_CONFIG.maxFileSize,
      allowedMimeTypes: DOCUMENT_CONFIG.allowedMimeTypes,
      maxFileSizeMB: DOCUMENT_CONFIG.maxFileSize / (1024 * 1024)
    }
  });
};


/**
 * Calcular porcentaje de completitud de documentos
 * @param {Object} documentSummary - Resumen de documentos
 * @returns {number} Porcentaje (0-100)
 */
const calculateCompletionPercentage = (documentSummary) => {
  const types = Object.values(documentSummary);
  const requiredTypes = types.filter(type => type.required);
  const uploadedRequired = requiredTypes.filter(type => type.uploaded > 0);
  
  if (requiredTypes.length === 0) return 100;
  
  return Math.round((uploadedRequired.length / requiredTypes.length) * 100);
};


/**
 * Middleware para manejar errores de Multer
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'Archivo demasiado grande',
          maxSize: `${DOCUMENT_CONFIG.maxFileSize / (1024 * 1024)}MB`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Demasiados archivos'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Campo de archivo inesperado'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Error en upload de archivo',
          error: err.message
        });
    }
  }
  
  if (err.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de archivo no permitido',
      allowedTypes: DOCUMENT_CONFIG.allowedMimeTypes
    });
  }
  
  next(err);
};


module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
  deleteDocument,
  validateDocuments,
  getDocumentConfig,
  handleMulterError
};