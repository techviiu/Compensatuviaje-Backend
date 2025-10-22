/**
 * 📄 DOCUMENT SERVICE - CompensaTuViaje
 * 
 * Funcionalidades:
 * - Upload y gestión de documentos legales
 * - Validación e integridad de archivos
 * - Storage en sistema de archivos
 * - Metadata y tracking de documentos
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const { 
  validateFile, 
  validateDocumentSet, 
  generateSafeFilename 
} = require('../validators/documentValidator');
const logger = require('../../../utils/logger');

const prisma = new PrismaClient();

// Configuración de storage
const STORAGE_CONFIG = {
  basePath: process.env.UPLOADS_PATH || './uploads',
  documentsPath: 'documents',
  maxRetentionDays: 2555 // ~7 años
};

/**
 * Subir documento para una empresa
 * @param {string} companyId - ID de la empresa
 * @param {Object} file - Archivo multer
 * @param {string} docType - Tipo de documento
 * @param {string} uploadedByUserId - ID del usuario que sube el archivo
 * @param {string} description - Descripción opcional
 * @returns {Object} Documento creado
 */
const uploadDocument = async (companyId, file, docType, uploadedByUserId, description = null) => {
  try {
    // 1. Validar archivo
    const validation = validateFile(file, docType);
    if (!validation.isValid) {
      throw new Error(`Archivo inválido: ${validation.errors.join(', ')}`);
    }

    // 2. Verificar que empresa existe
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new Error('Empresa no encontrada');
    }

    // 3. Generar nombre de archivo seguro
    const safeFilename = generateSafeFilename(file.originalname, companyId, docType);
    
    // 4. Crear estructura de directorios
    const companyDir = path.join(STORAGE_CONFIG.basePath, STORAGE_CONFIG.documentsPath, companyId);
    await ensureDirectoryExists(companyDir);

    // 5. Guardar archivo en disco
    const filePath = path.join(companyDir, safeFilename);
    await fs.writeFile(filePath, file.buffer);

    // 6. Crear registros en base de datos (transacción)
    const result = await prisma.$transaction(async (tx) => {
      // Crear registro de archivo
      const fileUpload = await tx.fileUpload.create({
        data: {
          ownerType: 'company',
          ownerId: companyId,
          fileName: safeFilename,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storageUrl: filePath,
          checksum: validation.metadata.checksum
        }
      });

      // Crear documento de empresa
      const companyDocument = await tx.companyDocument.create({
        data: {
          companyId,
          docType,
          fileId: fileUpload.id,
          status: 'uploaded'
        }
      });

      return {
        document: companyDocument,
        file: fileUpload,
        metadata: validation.metadata
      };
    });

    // 7. Log de auditoría
    await createAuditLog({
      action: 'DOCUMENT_UPLOADED',
      entityType: 'CompanyDocument',
      entityId: result.document.id,
      actorUserId: uploadedByUserId,
      changesJson: JSON.stringify({
        docType,
        filename: safeFilename,
        size: file.size,
        checksum: validation.metadata.checksum
      })
    });

    logger.info('Documento subido exitosamente', {
      companyId,
      docType,
      filename: safeFilename,
      size: file.size
    });

    return result;

  } catch (error) {
    logger.error('Error subiendo documento', { 
      error: error.message, 
      companyId, 
      docType 
    });
    throw error;
  }
};

/**
 * Obtener documentos de una empresa
 * @param {string} companyId - ID de la empresa
 * @param {string} docType - Tipo de documento (opcional)
 * @returns {Array} Lista de documentos
 */
const getCompanyDocuments = async (companyId, docType = null) => {
  try {
    const where = { companyId };
    if (docType) {
      where.docType = docType;
    }

    const documents = await prisma.companyDocument.findMany({
      where,
      include: {
        file: true
      },
      orderBy: { uploadedAt: 'desc' }
    });

    return documents;

  } catch (error) {
    logger.error('Error obteniendo documentos', { 
      error: error.message, 
      companyId, 
      docType 
    });
    throw error;
  }
};

/**
 * Validar set completo de documentos de empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Object} Resultado de validación
 */
const validateCompanyDocuments = async (companyId) => {
  try {
    const documents = await getCompanyDocuments(companyId);
    return validateDocumentSet(documents);

  } catch (error) {
    logger.error('Error validando documentos de empresa', { 
      error: error.message, 
      companyId 
    });
    throw error;
  }
};

/**
 * Eliminar documento
 * @param {string} documentId - ID del documento
 * @param {string} deletedByUserId - ID del usuario que elimina
 * @returns {boolean} true si se eliminó correctamente
 */
const deleteDocument = async (documentId, deletedByUserId) => {
  try {
    // 1. Obtener documento con archivo
    const document = await prisma.companyDocument.findUnique({
      where: { id: documentId },
      include: { file: true }
    });

    if (!document) {
      throw new Error('Documento no encontrado');
    }

    // 2. Eliminar archivo físico
    try {
      await fs.unlink(document.file.storageUrl);
    } catch (fileError) {
      logger.warn('No se pudo eliminar archivo físico', { 
        path: document.file.storageUrl,
        error: fileError.message 
      });
    }

    // 3. Eliminar registros de base de datos
    await prisma.$transaction(async (tx) => {
      await tx.companyDocument.delete({
        where: { id: documentId }
      });

      await tx.fileUpload.delete({
        where: { id: document.fileId }
      });
    });

    // 4. Log de auditoría
    await createAuditLog({
      action: 'DOCUMENT_DELETED',
      entityType: 'CompanyDocument',
      entityId: documentId,
      actorUserId: deletedByUserId,
      changesJson: JSON.stringify({
        docType: document.docType,
        filename: document.file.fileName
      })
    });

    logger.info('Documento eliminado', { documentId, deletedByUserId });

    return true;

  } catch (error) {
    logger.error('Error eliminando documento', { 
      error: error.message, 
      documentId 
    });
    throw error;
  }
};

/**
 * Descargar archivo de documento
 * @param {string} documentId - ID del documento
 * @param {string} userId - ID del usuario que descarga
 * @returns {Object} Información del archivo para descarga
 */
const downloadDocument = async (documentId, userId) => {
  try {
    const document = await prisma.companyDocument.findUnique({
      where: { id: documentId },
      include: { 
        file: true,
        company: true
      }
    });

    if (!document) {
      throw new Error('Documento no encontrado');
    }

    // Verificar que archivo existe
    const exists = await fs.access(document.file.storageUrl).then(() => true).catch(() => false);
    if (!exists) {
      throw new Error('Archivo no encontrado en storage');
    }

    // Log de descarga
    logger.info('Documento descargado', { 
      documentId, 
      userId, 
      companyId: document.companyId 
    });

    return {
      filePath: document.file.storageUrl,
      filename: document.file.fileName,
      mimeType: document.file.mimeType,
      size: document.file.sizeBytes
    };

  } catch (error) {
    logger.error('Error descargando documento', { 
      error: error.message, 
      documentId 
    });
    throw error;
  }
};

/**
 * Crear directorio si no existe
 * @param {string} dirPath - Ruta del directorio
 */
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

/**
 * Crear log de auditoría
 * @param {Object} logData - Datos del log
 */
const createAuditLog = async (logData) => {
  try {
    await prisma.auditLog.create({
      data: logData
    });
  } catch (error) {
    logger.error('Error creando audit log', { error: error.message, logData });
  }
};

/**
 * Limpiar archivos antiguos (tarea de mantenimiento)
 * @param {number} retentionDays - Días de retención
 * @returns {Object} Estadísticas de limpieza
 */
const cleanupOldDocuments = async (retentionDays = STORAGE_CONFIG.maxRetentionDays) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Obtener archivos antiguos
    const oldFiles = await prisma.fileUpload.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        ownerType: 'company'
      }
    });

    let deletedCount = 0;
    let errorCount = 0;

    for (const file of oldFiles) {
      try {
        // Eliminar archivo físico
        await fs.unlink(file.storageUrl);
        
        // Eliminar registro de DB
        await prisma.fileUpload.delete({
          where: { id: file.id }
        });

        deletedCount++;
      } catch (error) {
        errorCount++;
        logger.warn('Error eliminando archivo antiguo', { 
          fileId: file.id, 
          error: error.message 
        });
      }
    }

    logger.info('Limpieza de documentos completada', { 
      deletedCount, 
      errorCount, 
      totalProcessed: oldFiles.length 
    });

    return { deletedCount, errorCount, totalProcessed: oldFiles.length };

  } catch (error) {
    logger.error('Error en limpieza de documentos', { error: error.message });
    throw error;
  }
};

module.exports = {
  uploadDocument,
  getCompanyDocuments,
  validateCompanyDocuments,
  deleteDocument,
  downloadDocument,
  cleanupOldDocuments
};