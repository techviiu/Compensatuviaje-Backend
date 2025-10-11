/**
 * 👥 USER CONTROLLER - REFACTORIZADO
 * 
 * ¿Qué hace este controller?
 * - ORQUESTACIÓN: Maneja requests HTTP y coordina responses
 * - DELEGACIÓN: Delega toda la lógica de negocio al userService
 * - VALIDACIÓN: Valida datos de entrada usando validators
 * - MAPEO DE ERRORES: Convierte errores de negocio a códigos HTTP
 * - CONTEXTO: Prepara contexto de auditoría (IP, user-agent)
 * 
 * 
 * Patrón usado: Controller-Service-Repository
 */

const logger = require('../../../utils/logger');
const userService = require('../services/userService');
const { userValidators } = require('../validators/authValidators');

class UserController {
  /**
   *  GET /api/auth/profile - Obtener perfil del usuario actual
   * 
   * ¿Qué hace?
   * - Extrae userId del token JWT (req.user.id)
   * - Llama al service para obtener datos completos
   * - Formatea response HTTP estándar
   * 

   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const profileData = await userService.getUserProfile(userId);

      res.json({
        success: true,
        data: profileData
      });

    } catch (error) {
      logger.error('UserController.getProfile error', {
        error: error.message,
        user_id: req.user?.id
      });

      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   *  PUT /api/auth/profile - Actualizar perfil del usuario
   * 
   * ¿Qué hace el service?
   * - Obtiene datos actuales para audit
   * - Merge inteligente de preferencias
   * - Actualiza en BD con Prisma
   * - Registra cambio en auditService
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const { error, value } = userValidators.updateProfile.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.details.map(d => d.message)
        });
      }

      const auditContext = {
        ip: req.ip,
        user_agent: req.get('User-Agent')
      };

      const updatedUser = await userService.updateUserProfile(
        userId,
        value,
        auditContext
      );

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: updatedUser
      });

    } catch (error) {
      logger.error('UserController.updateProfile error', {
        error: error.message,
        user_id: req.user?.id
      });

      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   *  PUT /api/users/change-password - Cambiar contraseña del usuario
   * 
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      
      // Validación de entrada
      const { error, value } = userValidators.changePassword.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.details.map(d => d.message)
        });
      }

      // Contexto de auditoría
      const auditContext = {
        ip: req.ip,
        user_agent: req.get('User-Agent')
      };

      await userService.changeUserPassword(
        userId,
        value.currentPassword,
        value.newPassword,
        auditContext
      );

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      logger.error('UserController.changePassword error', {
        error: error.message,
        user_id: req.user?.id
      });

      // Mapeo de errores específicos
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      if (error.message === 'INVALID_CURRENT_PASSWORD') {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   *  PUT /api/users/email - Actualizar email del usuario
   * 
   */
  async updateEmail(req, res) {
    try {
      const userId = req.user.id;
      
      // Validación
      const { error, value } = userValidators.updateEmail.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.details.map(d => d.message)
        });
      }

      const auditContext = {
        ip: req.ip,
        user_agent: req.get('User-Agent')
      };

      // Delegación al service
      const result = await userService.updateUserEmail(
        userId,
        value.newEmail,
        value.currentPassword,
        auditContext
      );

      res.json({
        success: true,
        message: 'Email actualizado. Se requiere verificación.',
        data: result
      });

    } catch (error) {
      logger.error('UserController.updateEmail error', {
        error: error.message,
        user_id: req.user?.id
      });

      // Mapeo centralizado de errores
      const errorMappings = {
        'EMAIL_ALREADY_EXISTS': { status: 400, message: 'Este email ya está registrado' },
        'INVALID_PASSWORD': { status: 400, message: 'Contraseña incorrecta' },
        'USER_NOT_FOUND': { status: 404, message: 'Usuario no encontrado' }
      };

      const errorMapping = errorMappings[error.message];
      if (errorMapping) {
        return res.status(errorMapping.status).json({
          success: false,
          message: errorMapping.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   *  GET /api/users/company - Listar usuarios de la empresa (solo admins)
   * 
   * ¿Qué hace el controller?
   * - Parsea query parameters (page, limit, search, filters)
   * - Valida límites máximos (100 users max por request)
   * - Extrae datos del usuario admin desde JWT
   * 
   * ¿Qué hace el service?
   * - Verifica permisos de admin (COMPANY_ADMIN, SUPER_ADMIN)
   * - Construye filtros complejos para Prisma
   * - Paginación y ordenamiento
   * - Incluye conteo de actividad reciente
   * - Log de acceso a lista de usuarios
   */
  async getCompanyUsers(req, res) {
    try {
      const adminUserId = req.user.id;
      const companyId = req.user.companyId;
      const adminRole = req.user.role;

      // Parsear parámetros de query (responsabilidad del controller)
      const filters = {
        search: req.query.search || '',
        role: req.query.role || '',
        status: req.query.status || '' // active, inactive, all
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 20, 100) // Max 100 para performance
      };

      const auditContext = {
        ip: req.ip,
        user_agent: req.get('User-Agent')
      };

      // Delegación al service
      const result = await userService.getCompanyUsers(
        adminUserId,
        companyId,
        adminRole,
        filters,
        pagination,
        auditContext
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('UserController.getCompanyUsers error', {
        error: error.message,
        user_id: req.user?.id,
        company_id: req.user?.companyId
      });

      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para esta operación'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   *  POST /api/users - Crear nuevo usuario (solo admins)
   * 
   * ¿Cuándo se usa?
   * - Admin crea cuenta para empleado
   * - Invitación a empresa
   * - Proceso de onboarding corporativo
   * 
   * ¿Qué hace el service?
   * - Verifica permisos del admin
   * - Valida que email no exista
   * - Valida roles permitidos según nivel del admin
   * - Genera contraseña temporal segura
   * - Marca usuario para cambio obligatorio de contraseña
   * - Log de creación para auditoría
   */
  async createUser(req, res) {
    try {
      const adminUserId = req.user.id;
      const companyId = req.user.companyId;
      const adminRole = req.user.role;

      // Validación de entrada
      const { error, value } = userValidators.createUser.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.details.map(d => d.message)
        });
      }

      const auditContext = {
        ip: req.ip,
        user_agent: req.get('User-Agent')
      };

      // Delegación al service
      const result = await userService.createUser(
        adminUserId,
        companyId,
        adminRole,
        value,
        auditContext
      );

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: {
          user: result.user,
          // ⚠️ SOLO PARA MVP - En producción enviar por email seguro
          temporaryPassword: result.temporaryPassword,
          instructions: 'El usuario debe cambiar esta contraseña en su primer login'
        }
      });

    } catch (error) {
      logger.error('UserController.createUser error', {
        error: error.message,
        user_id: req.user?.id,
        company_id: req.user?.companyId
      });

      // Mapeo centralizado de errores
      const errorMappings = {
        'INSUFFICIENT_PERMISSIONS': { status: 403, message: 'No tienes permisos para crear usuarios' },
        'EMAIL_ALREADY_EXISTS': { status: 400, message: 'Este email ya está registrado' },
        'INVALID_ROLE_ASSIGNMENT': { status: 400, message: 'No puedes asignar este rol' }
      };

      const errorMapping = errorMappings[error.message];
      if (errorMapping) {
        return res.status(errorMapping.status).json({
          success: false,
          message: errorMapping.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   *  PUT /api/users/:userId - Actualizar usuario (solo admins)
   * 
   * ¿Validaciones complejas en service?
   * - Admin no puede reducir su propio rol
   * - Solo puede administrar usuarios de su empresa (excepto SUPER_ADMIN)
   * - Validación de roles permitidos según nivel del admin
   * - Email único en toda la plataforma
   * - Cambio de email requiere re-verificación
   */
  async updateUser(req, res) {
    try {
      const adminUserId = req.user.id;
      const companyId = req.user.companyId;
      const adminRole = req.user.role;
      const targetUserId = req.params.userId;

      // Validación de entrada
      const { error, value } = userValidators.updateUser.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.details.map(d => d.message)
        });
      }

      const auditContext = {
        ip: req.ip,
        user_agent: req.get('User-Agent')
      };

      // Delegación al service
      const updatedUser = await userService.updateUser(
        adminUserId,
        companyId,
        adminRole,
        targetUserId,
        value,
        auditContext
      );

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: updatedUser
      });

    } catch (error) {
      logger.error('UserController.updateUser error', {
        error: error.message,
        user_id: req.user?.id,
        target_user_id: req.params.userId
      });

      // Mapeo extenso de errores específicos
      const errorMappings = {
        'INSUFFICIENT_PERMISSIONS': { status: 403, message: 'No tienes permisos para actualizar usuarios' },
        'USER_NOT_FOUND': { status: 404, message: 'Usuario no encontrado' },
        'CROSS_COMPANY_ACCESS_DENIED': { status: 403, message: 'No puedes actualizar usuarios de otras empresas' },
        'INVALID_ROLE_ASSIGNMENT': { status: 400, message: 'No puedes asignar este rol' },
        'CANNOT_DEMOTE_SELF': { status: 400, message: 'No puedes reducir tu propio rol' },
        'EMAIL_ALREADY_EXISTS': { status: 400, message: 'Este email ya está registrado' }
      };

      const errorMapping = errorMappings[error.message];
      if (errorMapping) {
        return res.status(errorMapping.status).json({
          success: false,
          message: errorMapping.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   *  DELETE /api/users/:userId - Desactivar usuario (soft delete)
   * 
   * ¿Por qué soft delete en service?
   * - Preservar integridad de datos históricos
   * - Auditoría y compliance regulatorio
   * - Posibilidad de reactivar usuario
   * - Mantener relaciones en BD (foreign keys)
   * - Log de seguridad para acción crítica
   */
  async deactivateUser(req, res) {
    try {
      const adminUserId = req.user.id;
      const companyId = req.user.companyId;
      const adminRole = req.user.role;
      const targetUserId = req.params.userId;

      const auditContext = {
        ip: req.ip,
        user_agent: req.get('User-Agent')
      };

      // Delegación al service
      const deactivatedUser = await userService.deactivateUser(
        adminUserId,
        companyId,
        adminRole,
        targetUserId,
        auditContext
      );

      res.json({
        success: true,
        message: 'Usuario desactivado exitosamente',
        data: deactivatedUser
      });

    } catch (error) {
      logger.error('UserController.deactivateUser error', {
        error: error.message,
        user_id: req.user?.id,
        target_user_id: req.params.userId
      });

      const errorMappings = {
        'INSUFFICIENT_PERMISSIONS': { status: 403, message: 'No tienes permisos para desactivar usuarios' },
        'USER_NOT_FOUND': { status: 404, message: 'Usuario no encontrado' },
        'CANNOT_DEACTIVATE_SELF': { status: 400, message: 'No puedes desactivar tu propia cuenta' },
        'CROSS_COMPANY_ACCESS_DENIED': { status: 403, message: 'No puedes desactivar usuarios de otras empresas' },
        'USER_ALREADY_INACTIVE': { status: 400, message: 'El usuario ya está desactivado' }
      };

      const errorMapping = errorMappings[error.message];
      if (errorMapping) {
        return res.status(errorMapping.status).json({
          success: false,
          message: errorMapping.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   *  POST /api/users/:userId/reactivate - Reactivar usuario
   * 
   * Para restaurar acceso a usuarios previamente desactivados
   */
  async reactivateUser(req, res) {
    try {
      const adminUserId = req.user.id;
      const companyId = req.user.companyId;
      const adminRole = req.user.role;
      const targetUserId = req.params.userId;

      const auditContext = {
        ip: req.ip,
        user_agent: req.get('User-Agent')
      };

      // Delegación al service
      const reactivatedUser = await userService.reactivateUser(
        adminUserId,
        companyId,
        adminRole,
        targetUserId,
        auditContext
      );

      res.json({
        success: true,
        message: 'Usuario reactivado exitosamente',
        data: reactivatedUser
      });

    } catch (error) {
      logger.error('UserController.reactivateUser error', {
        error: error.message,
        user_id: req.user?.id,
        target_user_id: req.params.userId
      });

      const errorMappings = {
        'INSUFFICIENT_PERMISSIONS': { status: 403, message: 'No tienes permisos para reactivar usuarios' },
        'USER_NOT_FOUND': { status: 404, message: 'Usuario no encontrado' },
        'USER_ALREADY_ACTIVE': { status: 400, message: 'El usuario ya está activo' }
      };

      const errorMapping = errorMappings[error.message];
      if (errorMapping) {
        return res.status(errorMapping.status).json({
          success: false,
          message: errorMapping.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   *  POST /api/users/:userId/reset-password - solo admins
   * 
   * ¿Cuándo se usa?
   * - Usuario olvida contraseña y no puede recuperarla
   * - Admin necesita resetear por política de seguridad
   * - Cuenta comprometida requiere reset inmediato
   */
  async resetUserPassword(req, res) {
    try {
      const adminUserId = req.user.id;
      const companyId = req.user.companyId;
      const adminRole = req.user.role;
      const targetUserId = req.params.userId;

      const auditContext = {
        ip: req.ip,
        user_agent: req.get('User-Agent')
      };

      // Delegación al service
      const result = await userService.resetUserPassword(
        adminUserId,
        companyId,
        adminRole,
        targetUserId,
        auditContext
      );

      res.json({
        success: true,
        message: 'Contraseña reseteada exitosamente',
        data: {
          // SOLO PARA MVP - En producción enviar por email seguro
          temporaryPassword: result.temporaryPassword,
          instructions: 'El usuario debe cambiar esta contraseña en su próximo login'
        }
      });

    } catch (error) {
      logger.error('UserController.resetUserPassword error', {
        error: error.message,
        user_id: req.user?.id,
        target_user_id: req.params.userId
      });

      const errorMappings = {
        'INSUFFICIENT_PERMISSIONS': { status: 403, message: 'No tienes permisos para resetear contraseñas' },
        'USER_NOT_FOUND': { status: 404, message: 'Usuario no encontrado' }
      };

      const errorMapping = errorMappings[error.message];
      if (errorMapping) {
        return res.status(errorMapping.status).json({
          success: false,
          message: errorMapping.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

// Crear instancia y exportar métodos individuales
const userController = new UserController();

module.exports = {
  getProfile: userController.getProfile.bind(userController),
  updateProfile: userController.updateProfile.bind(userController),
  changePassword: userController.changePassword.bind(userController),
  updateEmail: userController.updateEmail.bind(userController),
  getCompanyUsers: userController.getCompanyUsers.bind(userController),
  createUser: userController.createUser.bind(userController),
  updateUser: userController.updateUser.bind(userController),
  deactivateUser: userController.deactivateUser.bind(userController),
  reactivateUser: userController.reactivateUser.bind(userController),
  resetUserPassword: userController.resetUserPassword.bind(userController)
};
