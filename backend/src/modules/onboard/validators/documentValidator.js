/**
 *  Funcionalidades:
 * Validar los tipos de archivos
 * Validaar tamaño de estructura
 * Verificar integridad de documentos
 * Validar metadatos requiridos
 */

const path = require('path');
const crypto = require('crypto');

/**
 * Configuración de documentos permitidos
 */
const DOCUMENT_CONFIG = {
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],

  maxFileSize: 10 * 1024 * 1024,
  documentTypes: {
    'escritura_constitucion': {
      name: 'Escritura de Constitución',
      required: false,
      maxFiles: 1,
      allowedTypes: ['application/pdf']
    },
    'rut_empresa': {
      name: 'RUT Empresa',
      required: true,
      maxFiles: 1,
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
    },
    'representante_legal': {
      name: 'Cédula Representante Legal',
      required: false,
      maxFiles: 2, // Anverso y reverso
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
    },
    'poder_notarial': {
      name: 'Poder Notarial',
      required: false,
      maxFiles: 1,
      allowedTypes: ['application/pdf']
    },
    'otro': {
      name: 'Otro Documento',
      required: false,
      maxFiles: 5,
      allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    }
    }
};

/**
 * Validar archivo individual
 * @param {Object} file - Archivo multer
 * @param {string} docType - Tipo de documento
 * @returns {Object} Resultado de validación
 */
const validateFile = (file, docType) => {
  const result = {
    isValid: false,
    errors: [],
    metadata: {}
  };
  
  if (!file) {
    result.errors.push('Archivo requerido');
    return result;
  }
  
  const docConfig = DOCUMENT_CONFIG.documentTypes[docType];
  if (!docConfig) {
    result.errors.push('Tipo de documento inválido');
    return result;
  }
  
  if (!DOCUMENT_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
    result.errors.push(`Tipo de archivo no permitido: ${file.mimetype}`);
    return result;
  }
  
  if (!docConfig.allowedTypes.includes(file.mimetype)) {
    result.errors.push(`Tipo de archivo no permitido para ${docConfig.name}`);
    return result;
  }
  
  if (file.size > DOCUMENT_CONFIG.maxFileSize) {
    const maxSizeMB = DOCUMENT_CONFIG.maxFileSize / (1024 * 1024);
    result.errors.push(`Archivo excede el tamaño máximo de ${maxSizeMB}MB`);
    return result;
  }
  
  const extension = path.extname(file.originalname).toLowerCase();
  const validExtensions = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  };
  
  if (!validExtensions[file.mimetype]?.includes(extension)) {
    result.errors.push('Extensión de archivo no coincide con el tipo');
    return result;
  }
  
  result.metadata = {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    extension: extension,
    checksum: generateChecksum(file.buffer),
    uploadedAt: new Date().toISOString()
  };
  
  result.isValid = true;
  
  return result;
};

/**
 * Middleware Multer para validación de archivos
 */
const multerFileFilter = (req, file, cb) => {
  const docType = req.body.docType || req.query.docType;
  
  // Si no hay docType, validamos solo el mimeType general
  if (!docType) {
     if (DOCUMENT_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
       return cb(null, true);
     } else {
       return cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
     }
  }

  const validation = validateFile(file, docType);
  
  if (validation.isValid) {
    cb(null, true);
  } else {
    cb(new Error(validation.errors.join(', ')), false);
  }
};


/**
 * Validar nombre de archivo seguro
 * @param {string} filename - Nombre del archivo
 * @returns {boolean} true si es seguro
 */
const isSafeFilename = (filename) => {
  // Evitar caracteres peligrosos
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  
  // Evitar nombres reservados Windows
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  
  return !dangerousChars.test(filename) && 
         !reservedNames.test(filename) &&
         filename.length <= 255 &&
         filename.trim() === filename;
};

/**
 * Generar nombre de archivo único y seguro
 * @param {string} originalName - Nombre original
 * @param {string} companyId - ID de la empresa
 * @param {string} docType - Tipo de documento
 * @returns {string} Nombre de archivo único
 */
const generateSafeFilename = (originalName, companyId, docType) => {
  const timestamp = Date.now();
  const extension = path.extname(originalName);
  const randomStr = crypto.randomBytes(4).toString('hex');
  
  return `${companyId}_${docType}_${timestamp}_${randomStr}${extension}`;
};


/**
 * Generar checksum del archivo
 * @param {Buffer} buffer - Buffer del archivo
 * @returns {string} Checksum SHA-256
 */
const generateChecksum = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Validar conjunto completo de documentos para una empresa
 * @param {Array} documents - Array de documentos subidos
 * @returns {Object} Resultado de validación
 */
const validateDocumentSet = (documents) => {
  const result = {
    isValid: false,
    errors: [],
    warnings: [],
    documentSummary: {}
  };
  
  // Agrupar documentos por tipo
  const docsByType = {};
  documents.forEach(doc => {
    if (!docsByType[doc.docType]) {
      docsByType[doc.docType] = [];
    }
    docsByType[doc.docType].push(doc);
  });
  
  // Verificar documentos requeridos
  Object.entries(DOCUMENT_CONFIG.documentTypes).forEach(([type, config]) => {
    const docsOfType = docsByType[type] || [];
    
    if (config.required && docsOfType.length === 0) {
      result.errors.push(`Documento requerido faltante: ${config.name}`);
    }
    
    if (docsOfType.length > config.maxFiles) {
      result.errors.push(`Demasiados archivos para ${config.name} (máximo ${config.maxFiles})`);
    }
    
    result.documentSummary[type] = {
      name: config.name,
      required: config.required,
      uploaded: docsOfType.length,
      maxAllowed: config.maxFiles,
      status: config.required && docsOfType.length === 0 ? 'missing' : 
              docsOfType.length > 0 ? 'uploaded' : 'optional'
    };
  });
  
  // Verificar si hay suficientes documentos para proceder
  const hasAllRequired = Object.entries(DOCUMENT_CONFIG.documentTypes)
    .filter(([_, config]) => config.required)
    .every(([type, _]) => (docsByType[type] || []).length > 0);
  
  if (hasAllRequired && result.errors.length === 0) {
    result.isValid = true;
  }
  
  return result;
};


module.exports = {
  DOCUMENT_CONFIG,
  validateFile,
  validateDocumentSet,
  generateChecksum,
  multerFileFilter,
  isSafeFilename,
  generateSafeFilename
};