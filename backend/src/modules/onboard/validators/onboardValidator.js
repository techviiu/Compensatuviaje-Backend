/**
 * Funcionalidades:
 * - Validar datos empresariales completas
 * - Validar emails corporativos
 * - validar documentos requeridos
 * - validar workflow de estado
 */

import {body, validationResult} from 'express-validator';
import {validateRutResult} from '../validators/rutValidator.js';
/**
 * Validaciones para registro inicial de la empresa
 */

const validateCompanyRegistration = [
    // Datos básico empresa
    body('razonSocial')
        .trim()
        .isLength({min: 3, max: 255})
        .withMessage('Razon social debe tener entre 3 y 255 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\.\-&,0-9]+$/)
        .withMessage('Razón social contiene caracteres inválidos'),

    body('rut')
        .custom((value) =>{
            const validation = validateRutResult(value);
            if(!validation.isValid){
                throw new Error(`RUT invalido. ${validation.errors.join(', ')}`)
            }
            return true;
    }),
    body('nombreComercial')
        .optional()
        .trim()
        .isLength({max: 255})
        .withMessage('Nombre comercial no puede execeder 255 carateres'),        

    // Ejemplo de valor válido para giroSii:
    // "Transporte aéreo nacional e internacional de pasajeros"
    body('giroSii')
        .optional()
        .trim()
        .isLength({max: 255})
        .withMessage('Giro SII no puede exceder 255 caracteres '),
    body('tamanoEmpresa')
        .optional()
        .isIn(['micro', 'pequeña', 'mediana', 'grande'])
        .withMessage('El tamaño de la empresa deve ser micro, pequeña, mediana, grande'),

    // Datos de contacto
    body('direccion')
        .optional()
        .trim()
        .isLength({max: 500})
        .withMessage('Dirección no puede execeder 500 caracteres'),

    body('phone')
        .optional()
        .matches(/^(\+56)?[2-9]\d{8,9}$/)
        .withMessage('Teléfono debe ser formato chileno válido'),

    body('adminUser.name')
        .trim()
        .isLength({min: 2, max: 100})
        .withMessage('Nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
        .withMessage('Nombre solo puede contener letras y espacios'),
    body('adminUser.email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido')
        .isLength({max: 255})
        .withMessage('Email no puede execeder 255 caracteres'),
    body('adminUser.password')
        .isLength({min: 8, max: 129})
        .withMessage('contraseña debe tener entre 8 y 129 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Contraseña debe contener: minúscula, mayúscul, número y símbolo'),
];

/**
 * Validaciones para acatualizacción de empresas
 */
const validateCompanyUpdate = [
  body('razonSocial')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Razón social debe tener entre 3 y 255 caracteres'),
    
  body('nombreComercial')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nombre comercial no puede exceder 255 caracteres'),
    
  body('giroSii')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Giro SII no puede exceder 255 caracteres'),
    
  body('tamanoEmpresa')
    .optional()
    .isIn(['micro', 'pequeña', 'mediana', 'grande'])
    .withMessage('Tamaño empresa inválido'),
    
  body('direccion')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Dirección no puede exceder 500 caracteres'),
    
  body('phone')
    .optional()
    .matches(/^(\+56)?[2-9]\d{8,9}$/)
    .withMessage('Teléfono debe ser formato chileno válido'),
    
  body('slugPublico')
    .optional()
    .isSlug()
    .isLength({ min: 3, max: 50 })
    .withMessage('Slug debe tener entre 3 y 50 caracteres, solo letras, números y guiones'),
];

/**
 * Validación de dominio corporativo
 */
const validateCorporateDomain = [
    body('domain')
        .isFQDN()
        .withMessage('Dominio inválido')
        .custom((value) =>{
            // Verificar que se un dominio público
            const publicDomains = [
                'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'live.com', 'msn.com', 'aol.com', 'icloud.com'
            ];
            if(publicDomains.includes(value.toLowerCase())){
                throw new Error('No se permite dominios públicos para verificación empresarial')
            }
            return true
        }),
];

/**
 * Validación de documentos legales
 */
const validateDocumentUpload = [
    body('docType')
        .isIn(['escritura_constitucion', 'rut_empresa', 'representante_legal', 'poder_notarial', 'otro'])
        .withMessage('Nombre de documento inválido'),
    body('description')
        .optional()
        .trim()
        .isLength({max: 500})
        .withMessage('La Descripción no puede exeer de los 500 caracteres')
];

/**
 * Validación cambio de estado de empresa
 */

const validateCompanyStatusChange = [
    body('fromStatus')
        .isIn(['registered', 'pending_contract', 'signed', 'active', 'suspend'])
        .withMessage('Estado origen enválido'),
    body('toStatus')
        .isIn(['registered', 'pending_contract', 'signed', 'active', 'suspend'])
        .withMessage("Estado destino inválido"),

    body('note')
        .optional()
        .trim()
        .isLength({max: 1000})
        .withMessage('La nota no puede execeder de 1000 caracteres ')
];


/**
 * Middleware para procesar errores de validación
 */

const handleValidationErrors = (req, res, next) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            success: false,
            message: 'Errores de validacion',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        })
    }
    next()
}


/**
 * Validar transición de estados válida
 */

const validateStatusTransition = (fromStatus, toStatus) =>{
    const validTransitions = {
        'registered': ['pending_contract', 'suspend'],
        'pending_contract': ['signed', 'registered', 'suspend'],
        'signed': ['active', 'suspend'],
        'suspend': ['active', 'registered']
    };

    return validTransitions[fromStatus]?.includes(toStatus)
};

const isValidCorporateEmail = (email, companyDomains) =>{
    if(!email || !Array.isArray(companyDomains)) return false;

    const emailDomain = email.split('@')[1]?.toLowerCase();
    return companyDomains.some(domain = domain.domain.toLowerCase() === emailDomain && domain.verified); 
};

export  {
    validateCompanyRegistration,
    validateCompanyUpdate,
    validateCorporateDomain,
    validateDocumentUpload,
    validateCompanyStatusChange,
    handleValidationErrors,
    validateStatusTransition,
    isValidCorporateEmail
};