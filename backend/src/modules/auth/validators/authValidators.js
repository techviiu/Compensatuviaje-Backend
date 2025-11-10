/**
 * ✅ AUTH VALIDATORS
 * 
 * ¿Qué hace?
 * - Valida que los datos de entrada tengan el formato correcto
 * - Previene inyecciones y ataques de entrada maliciosa
 * - Sanitiza datos antes de procesarlos
 * - Proporciona mensajes de error claros al frontend
 * 
 * ¿Por qué es crítico?
 * - Primera línea de defensa contra datos maliciosos
 * - Evita que datos inválidos lleguen a la base de datos
 * - Mejora UX con mensajes de error específicos
 * - Previene crashes por tipos de datos incorrectos
 * 
 * ¿Cómo se conecta?
 * - Controllers llaman validators ANTES de procesar
 * - Si validación falla, retorna error sin llamar services
 * - Si validación pasa, datos limpios van a authService
 */

const Joi = require('joi');

/**
 * 🔑 Validador para LOGIN
 * 
 * ¿Qué valida?
 * - Email: formato válido, longitud máxima, lowercase
 * - Password: longitud mínima (sin exponer requisitos por seguridad)
 * - Remember_me: booleano opcional para sesión extendida
 * 
 * ¿Por qué estas reglas?
 * - Email format previene errores de tipeo y ataques
 * - Password mínimo pero sin exponer política completa (por seguridad)
 * - Remember_me permite UX mejorada sin comprometer seguridad
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email({ 
      minDomainSegments: 2,  // ej: user@domain.com (no user@localhost)
      tlds: { allow: true }  // Permitir todos los TLDs válidos
    })
    .max(255)               // Prevenir emails extremadamente largos
    .lowercase()            // Normalizar a lowercase
    .trim()                 // Remover espacios
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'string.max': 'Email no puede exceder 255 caracteres',
      'any.required': 'Email es requerido'
    }),

  password: Joi.string()
    .min(8)                 
    .max(128)               
    .required()
    .messages({
      'string.min': 'Contraseña debe tener al menos 6 caracteres',
      'string.max': 'Contraseña no puede exceder 128 caracteres',
      'any.required': 'Contraseña es requerida'
    }),

  remember_me: Joi.boolean()
    .optional()
    .default(false)         // Por defecto no recordar
    .messages({
      'boolean.base': 'Remember me debe ser verdadero o falso'
    })
});

/**
 * 🔄 Validador para REFRESH TOKEN
 * 
 * ¿Qué valida?
 * - Refresh_token: string no vacío, formato JWT básico
 * 

 */
const refreshSchema = Joi.object({
  refreshToken: Joi.string()
    .pattern(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/) // JWT format básico
    .required()
    .messages({
      'string.pattern.base': 'Refresh token tiene formato inválido',
      'any.required': 'Refresh token es requerido'
    })
});

/**
 * 🔐 Validador para CAMBIO DE CONTRASEÑA
 * 
 * ¿Qué valida?
 * - Current_password: contraseña actual para verificación
 * - New_password: nueva contraseña con política básica
 * - Confirm_password: confirmación que coincida
 * 
 * ¿Por qué estas reglas?
 * - Verificar contraseña actual previene cambios no autorizados
 * - Nueva contraseña debe cumplir política mínima
 * - Confirmación previene errores de tipeo
 * (Tambien se va validar en el front)
 */
const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'any.required': 'Contraseña actual es requerida'
    }),

  new_password: Joi.string()
    .min(8)                 // MVP Real: mínimo 8 caracteres
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/) // Al menos: 1 minúscula, 1 mayúscula, 1 número
    .required()
    .messages({
      'string.min': 'Nueva contraseña debe tener al menos 8 caracteres',
      'string.max': 'Nueva contraseña no puede exceder 128 caracteres',
      'string.pattern.base': 'Nueva contraseña debe tener al menos 1 minúscula, 1 mayúscula y 1 número',
      'any.required': 'Nueva contraseña es requerida'
    }),

  confirm_password: Joi.string()
    .valid(Joi.ref('new_password'))  // Debe coincidir con new_password
    .required()
    .messages({
      'any.only': 'Confirmación de contraseña no coincide',
      'any.required': 'Confirmación de contraseña es requerida'
    }),

  force_logout_other_sessions: Joi.boolean()
    .optional()
    .default(true)          // Por defecto cerrar otras sesiones por seguridad
    .messages({
      'boolean.base': 'Force logout debe ser verdadero o falso'
    })
});

/**
 * 📧 Validador para RECUPERAR CONTRASEÑA (para futuro)
 * 
 * MVP: No implementado aún, pero preparado para cuando se necesite
 */
const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: true } })
    .max(255)
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'Email es requerido'
    })
});

/**
 * 🔄 Validador para RESETEAR CONTRASEÑA (para futuro)
 */
const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .length(64)             // Token de reset típicamente 64 chars
    .pattern(/^[A-Fa-f0-9]+$/) // Hex string
    .required()
    .messages({
      'string.length': 'Token de reset inválido',
      'string.pattern.base': 'Token de reset tiene formato inválido',
      'any.required': 'Token de reset es requerido'
    }),

  new_password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .required()
    .messages({
      'string.min': 'Contraseña debe tener al menos 8 caracteres',
      'string.pattern.base': 'Contraseña debe tener al menos 1 minúscula, 1 mayúscula y 1 número',
      'any.required': 'Contraseña es requerida'
    })
});

/**
 * 🛠️ FUNCIONES DE VALIDACIÓN
 * 
 * ¿Cómo usar en controllers?
 * const { error, value } = validateLogin(req.body);
 * if (error) return res.status(400).json({...});
 * // usar value en lugar de req.body (datos sanitizados)
 */

/**
 * Validar datos de login
 */
const validateLogin = (data) => {
  const result = loginSchema.validate(data, {
    abortEarly: false,      // Retornar TODOS los errores, no solo el primero
    stripUnknown: true,     // Remover campos no definidos en schema
    convert: true           // Convertir tipos automáticamente (ej: "true" -> true)
  });
  
  return {
    error: result.error,
    value: result.value
  };
};

/**
 * Validar refresh token
 */
const validateRefresh = (data) => {
  const result = refreshSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  return {
    error: result.error,
    value: result.value
  };
};

/**
 * Validar cambio de contraseña
 */
const validateChangePassword = (data) => {
  const result = changePasswordSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  return {
    error: result.error,
    value: result.value
  };
};

/**
 * Validar recuperar contraseña
 */
const validateForgotPassword = (data) => {
  const result = forgotPasswordSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  return {
    error: result.error,
    value: result.value
  };
};

/**
 * Validar resetear contraseña
 */
const validateResetPassword = (data) => {
  const result = resetPasswordSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  return {
    error: result.error,
    value: result.value
  };
};

/**
 * 🔍 HELPER: Validar formato de email sin esquema completo
 * 
 * Útil para validaciones rápidas en otros módulos
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

/**
 * 🔍 HELPER: Validar fortaleza básica de contraseña
 * 
 * Para feedback en tiempo real en frontend
 */
const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password) // Opcional para MVP
  };

  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    score: score,
    maxScore: 5,
    checks: checks,
    strength: score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong'
  };
};

/**
 * 🧹 HELPER: Sanitizar entrada de usuario
 * 
 * Remueve caracteres peligrosos para prevenir XSS básico
 */
const sanitizeUserInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()                           // Remover espacios
    .replace(/[<>]/g, '')            // Remover < y > básicos
    .substring(0, 1000);             // Limitar longitud máxima
};

/**
 * 👤 VALIDADORES PARA USER MANAGEMENT
 * 
 * Separados lógicamente pero en el mismo archivo para cohesión
 */

/**
 * 📝 Validador para ACTUALIZAR PERFIL
 */
const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.min': 'Nombre debe tener al menos 2 caracteres',
      'string.max': 'Nombre no puede exceder 100 caracteres'
    }),

  preferences: Joi.object({
    language: Joi.string().valid('es', 'en').optional(),
    timezone: Joi.string().optional(),
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      push: Joi.boolean().optional(),
      marketing: Joi.boolean().optional()
    }).optional(),
    theme: Joi.string().valid('light', 'dark', 'auto').optional(),
    dateFormat: Joi.string().valid('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD').optional()
  }).optional()
});

/**
 * 📧 Validador para ACTUALIZAR EMAIL
 */
const updateEmailSchema = Joi.object({
  newEmail: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: true } })
    .max(255)
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'Nuevo email es requerido'
    }),

  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Contraseña actual es requerida para cambiar email'
    })
});

/**
 * ➕ Validador para CREAR USUARIO (admin)
 */
const createUserSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: true } })
    .max(255)
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'Email es requerido'
    }),

  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'Nombre debe tener al menos 2 caracteres',
      'string.max': 'Nombre no puede exceder 100 caracteres',
      'any.required': 'Nombre es requerido'
    }),

  role: Joi.string()
    .valid('USER', 'COMPANY_ADMIN', 'SUPERADMIN')
    .required()
    .messages({
      'any.only': 'Rol debe ser USER, COMPANY_ADMIN o SUPERADMIN',
      'any.required': 'Rol es requerido'
    })
});

/**
 * ✏️ Validador para ACTUALIZAR USUARIO (admin)
 */
const updateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.min': 'Nombre debe tener al menos 2 caracteres',
      'string.max': 'Nombre no puede exceder 100 caracteres'
    }),

  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: true } })
    .max(255)
    .lowercase()
    .trim()
    .optional()
    .messages({
      'string.email': 'Debe ser un email válido'
    }),

  role: Joi.string()
    .valid('USER', 'COMPANY_ADMIN', 'SUPERADMIN')
    .optional()
    .messages({
      'any.only': 'Rol debe ser USER, COMPANY_ADMIN o SUPERADMIN'
    }),

  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Estado activo debe ser verdadero o falso'
    })
});

/**
 * 🛠️ FUNCIONES DE VALIDACIÓN PARA USER MANAGEMENT
 */

const validateUpdateProfile = (data) => {
  const result = updateProfileSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  return {
    error: result.error,
    value: result.value
  };
};

const validateUpdateEmail = (data) => {
  const result = updateEmailSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  return {
    error: result.error,
    value: result.value
  };
};

const validateCreateUser = (data) => {
  const result = createUserSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  return {
    error: result.error,
    value: result.value
  };
};

const validateUpdateUser = (data) => {
  const result = updateUserSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  return {
    error: result.error,
    value: result.value
  };
};

module.exports = {
  // Funciones principales de validación AUTH
  validateLogin,
  validateRefresh,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  
  // Funciones de validación USER MANAGEMENT
  userValidators: {
    updateProfile: { validate: validateUpdateProfile },
    updateEmail: { validate: validateUpdateEmail },
    createUser: { validate: validateCreateUser },
    updateUser: { validate: validateUpdateUser },
    changePassword: { validate: validateChangePassword } // Reutilizar del auth
  },
  
  // Helpers utilitarios
  isValidEmail,
  checkPasswordStrength,
  sanitizeUserInput,
  
  // Esquemas exportados para testing
  schemas: {
    loginSchema,
    refreshSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    updateEmailSchema,
    createUserSchema,
    updateUserSchema
  }
};
