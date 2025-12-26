/**
 * 👥 USER SERVICE
 * 
 * ¿Qué hace?
 * - Contiene TODA la lógica de negocio para gestión de usuarios
 * - Operaciones CRUD con validaciones de negocio
 * - Gestión de permisos y roles
 * - Integración con auditService para logging
 * - Operaciones de perfil de usuario
 * 
  
 * ¿Cómo se conecta?
 * - userController llama a userService
 * - userService usa Prisma para BD
 * - userService llama a auditService para logs
 * - userService valida permisos de negocio
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const logger = require('../../../utils/logger');
const auditService = require('./auditService');

const prisma = new PrismaClient();

class UserService {
  /**
   * 👤 Obtener perfil completo del usuario
   * 
   * @param {string} userId - ID del usuario
   * @returns {Object} Datos del perfil del usuario
   */
  async getUserProfile(userId) {
    try {
      if (!userId) {
        throw new Error('USER_ID_REQUIRED');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          companyUsers: {
            include: {
              company: true
            }
          },
          // Incluir datos de auditoría reciente
          auditLogs: {
            take: 5,
            orderBy: {
              createdAt: 'desc'
            },
            select: {
              action: true,
              createdAt: true,
              entityType: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const primaryCompanyUser = user.companyUsers?.[0];
      const company = primaryCompanyUser?.company;

      // Formatear respuesta (sin datos sensibles)
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        isSuperAdmin: user.isSuperAdmin,
        userType: user.userType,
        createdAt: user.createdAt,
        
        // Información de empresa
        company: company ? {
          id: company.id,
          name: company.nombreComercial,
          rut: company.rut,
          status: company.status
        } : null,
        
        // Actividad reciente (para dashboard personal)
        recentActivity: user.auditLogs.map(log => ({
          action: log.action,
          type: log.entityType,
          timestamp: log.createdAt
        }))
      };

    } catch (error) {
      logger.error('Error getting user profile', {
        error: error.message,
        user_id: userId
      });
      throw error;
    }
  }

  /**
   *  Actualizar perfil del usuario
   * 
   * @param {string} userId - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} auditContext - Contexto para auditoría (ip, user_agent)
   * @returns {Object} Usuario actualizado
   */
  async updateUserProfile(userId, updateData, auditContext = {}) {
    try {
      // Obtener datos actuales para audit
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          preferences: true,
          companyId: true
        }
      });

      if (!currentUser) {
        throw new Error('USER_NOT_FOUND');
      }

      // Preparar datos de actualización
      const updatePayload = {};
      if (updateData.name) updatePayload.name = updateData.name;
      if (updateData.preferences) {
        // Merge con preferencias existentes
        updatePayload.preferences = {
          ...(currentUser.preferences || {}),
          ...updateData.preferences
        };
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updatePayload,
        select: {
          id: true,
          name: true,
          preferences: true,
          updatedAt: true
        }
      });

      // Registrar cambio en auditoría
      await auditService.logEvent({
        user_id: userId,
        company_id: currentUser.companyId,
        action: 'PROFILE_UPDATED',
        entity_type: 'user_profile',
        entity_id: userId,
        details: auditContext,
        changes: {
          before: {
            name: currentUser.name,
            preferences: currentUser.preferences
          },
          after: {
            name: updatedUser.name,
            preferences: updatedUser.preferences
          }
        }
      });

      return updatedUser;

    } catch (error) {
      logger.error('Error updating user profile', {
        error: error.message,
        user_id: userId
      });
      throw error;
    }
  }

  /**
   *  Cambiar contraseña del usuario
   * 
   * @param {string} userId - ID del usuario
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @param {Object} auditContext - Contexto para auditoría
   * @returns {boolean} Éxito de la operación
   */
  async changeUserPassword(userId, currentPassword, newPassword, auditContext = {}) {
    try {
      // Obtener usuario actual
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, passwordHash: true, companyId: true }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );

      if (!isCurrentPasswordValid) {
        // Log intento de cambio con contraseña incorrecta
        await auditService.logSecurityEvent(
          userId,
          user.companyId,
          'PASSWORD_CHANGE_INVALID_CURRENT',
          'MEDIUM',
          {
            ...auditContext,
            reason: 'Current password verification failed'
          }
        );

        throw new Error('INVALID_CURRENT_PASSWORD');
      }

      // Hash nueva contraseña
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar en base de datos
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        }
      });

      // Log cambio exitoso
      await auditService.logSecurityEvent(
        userId,
        user.companyId,
        'PASSWORD_CHANGED_SUCCESS',
        'LOW',
        {
          ...auditContext,
          initiated_by: 'user_profile'
        }
      );

      return true;

    } catch (error) {
      logger.error('Error changing password', {
        error: error.message,
        user_id: userId
      });
      throw error;
    }
  }

  /**
   * Actualizar email del usuario (con verificación)
   * 
   * @param {string} userId - ID del usuario
   * @param {string} newEmail - Nuevo email
   * @param {string} currentPassword - Contraseña para verificación
   * @param {Object} auditContext - Contexto para auditoría
   * @returns {Object} Resultado de la operación
   */
  async updateUserEmail(userId, newEmail, currentPassword, auditContext = {}) {
    try {
      // Verificar que el email no esté en uso
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail }
      });

      if (existingUser && existingUser.id !== userId) {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }

      // Obtener usuario actual
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          passwordHash: true, 
          companyId: true 
        }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Verificar contraseña actual
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );

      if (!isPasswordValid) {
        await auditService.logSecurityEvent(
          userId,
          user.companyId,
          'EMAIL_CHANGE_INVALID_PASSWORD',
          'MEDIUM',
          {
            ...auditContext,
            attempted_new_email: newEmail
          }
        );

        throw new Error('INVALID_PASSWORD');
      }

      // Actualizar email
      await prisma.user.update({
        where: { id: userId },
        data: {
          email: newEmail,
          emailVerified: false, // Requerir re-verificación
          updatedAt: new Date()
        }
      });

      // Log cambio crítico
      await auditService.logEvent({
        user_id: userId,
        company_id: user.companyId,
        action: 'EMAIL_UPDATED',
        entity_type: 'user_account',
        entity_id: userId,
        details: {
          ...auditContext,
          verification_required: true
        },
        changes: {
          before: { email: user.email },
          after: { email: newEmail }
        }
      });

      return {
        newEmail: newEmail,
        emailVerified: false
      };

    } catch (error) {
      logger.error('Error updating email', {
        error: error.message,
        user_id: userId
      });
      throw error;
    }
  }

  /**
   *  Obtener usuarios de la empresa (con filtros y paginación)
   * 
   * @param {string} adminUserId - ID del admin que hace la consulta
   * @param {string} companyId - ID de la empresa
   * @param {string} adminRole - Rol del admin
   * @param {Object} filters - Filtros de búsqueda
   * @param {Object} pagination - Parámetros de paginación
   * @param {Object} auditContext - Contexto para auditoría
   * @returns {Object} Lista de usuarios y metadata de paginación
   */
  async getCompanyUsers(adminUserId, companyId, adminRole, filters = {}, pagination = {}, auditContext = {}) {
    try {
      // Verificar permisos de admin
      if (!['COMPANY_ADMIN', 'SUPERADMIN'].includes(adminRole)) {
        throw new Error('INSUFFICIENT_PERMISSIONS');
      }

      const {
        search = '',
        role = '',
        status = '', // active, inactive, all
      } = filters;

      const {
        page = 1,
        limit = 20
      } = pagination;

      const finalLimit = Math.min(limit, 100); // Max 100

      // Construir filtros
      const where = {
        companyId: companyId
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (role && role !== 'all') {
        where.role = role;
      }

      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      }

      // Obtener usuarios con paginación
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            // Información de actividad reciente
            _count: {
              select: {
                auditLogs: {
                  where: {
                    createdAt: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
                    }
                  }
                }
              }
            }
          },
          orderBy: [
            { isActive: 'desc' }, // Activos primero
            { name: 'asc' }
          ],
          skip: (page - 1) * finalLimit,
          take: finalLimit
        }),

        prisma.user.count({ where: where })
      ]);

      // Formatear respuesta
      const formattedUsers = users.map(user => ({
        ...user,
        recentActivityCount: user._count.auditLogs
      }));

      // Log acceso a lista de usuarios
      await auditService.logEvent({
        user_id: adminUserId,
        company_id: companyId,
        action: 'COMPANY_USERS_ACCESSED',
        entity_type: 'user_management',
        entity_id: companyId,
        details: {
          ...auditContext,
          filters: { search, role, status },
          page: page,
          limit: finalLimit,
          total_results: totalCount
        }
      });

      return {
        users: formattedUsers,
        pagination: {
          page: page,
          limit: finalLimit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / finalLimit)
        }
      };

    } catch (error) {
      logger.error('Error getting company users', {
        error: error.message,
        admin_user_id: adminUserId,
        company_id: companyId
      });
      throw error;
    }
  }

  /**
   *  Crear nuevo usuario (solo admins)
   * 
   * @param {string} adminUserId - ID del admin que crea
   * @param {string} companyId - ID de la empresa
   * @param {string} adminRole - Rol del admin
   * @param {Object} userData - Datos del nuevo usuario
   * @param {Object} auditContext - Contexto para auditoría
   * @returns {Object} Usuario creado y contraseña temporal
   */
  async createUser(adminUserId, companyId, adminRole, userData, auditContext = {}) {
    try {
      // Verificar permisos
      if (!['COMPANY_ADMIN', 'SUPERADMIN'].includes(adminRole)) {
        throw new Error('INSUFFICIENT_PERMISSIONS');
      }

      const { email, name, role } = userData;

      // Verificar que email no exista
      const existingUser = await prisma.user.findUnique({
        where: { email: email }
      });

      if (existingUser) {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }

      // Validar rol del nuevo usuario
      const allowedRoles = adminRole === 'SUPERADMIN' 
        ? ['USER', 'COMPANY_ADMIN', 'SUPERADMIN']
        : ['USER', 'COMPANY_ADMIN'];

      if (!allowedRoles.includes(role)) {
        throw new Error('INVALID_ROLE_ASSIGNMENT');
      }

      // Generar contraseña temporal
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS  || "8");
      const passwordHash = await bcrypt.hash(tempPassword, saltRounds);

      // Crear usuario
      const newUser = await prisma.user.create({
        data: {
          email: email,
          name: name,
          role: role,
          passwordHash: passwordHash,
          companyId: companyId,
          isActive: true,
          emailVerified: false, // Requiere verificación
          preferences: {
            requirePasswordChange: true,
            createdByAdmin: true
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });

      // Log creación de usuario
      await auditService.logEvent({
        user_id: adminUserId,
        company_id: companyId,
        action: 'USER_CREATED',
        entity_type: 'user_account',
        entity_id: newUser.id,
        details: {
          ...auditContext,
          new_user_email: email,
          new_user_role: role,
          created_by_admin: true
        }
      });

      return {
        user: newUser,
        temporaryPassword: tempPassword
      };

    } catch (error) {
      logger.error('Error creating user', {
        error: error.message,
        admin_id: adminUserId,
        company_id: companyId
      });
      throw error;
    }
  }

  /**
   * Actualizar usuario (solo admins)
   * 
   * @param {string} adminUserId - ID del admin
   * @param {string} companyId - ID de la empresa
   * @param {string} adminRole - Rol del admin
   * @param {string} targetUserId - ID del usuario a actualizar
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} auditContext - Contexto para auditoría
   * @returns {Object} Usuario actualizado
   */
  async updateUser(adminUserId, companyId, adminRole, targetUserId, updateData, auditContext = {}) {
    try {
      // Verificar permisos
      if (!['COMPANY_ADMIN', 'SUPERADMIN'].includes(adminRole)) {
        throw new Error('INSUFFICIENT_PERMISSIONS');
      }

      // Obtener usuario objetivo
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          company: { select: { id: true, name: true } }
        }
      });

      if (!targetUser) {
        throw new Error('USER_NOT_FOUND');
      }

      // Verificar que el usuario pertenece a la misma empresa (excepto SUPERADMIN)
      if (adminRole !== 'SUPERADMIN' && targetUser.companyId !== companyId) {
        throw new Error('CROSS_COMPANY_ACCESS_DENIED');
      }

      // Validar cambios de rol
      if (updateData.role && updateData.role !== targetUser.role) {
        const allowedRoles = adminRole === 'SUPERADMIN' 
          ? ['USER', 'COMPANY_ADMIN', 'SUPERADMIN']
          : ['USER', 'COMPANY_ADMIN'];

        if (!allowedRoles.includes(updateData.role)) {
          throw new Error('INVALID_ROLE_ASSIGNMENT');
        }

        // No permitir que admin se quite sus propios privilegios
        if (targetUserId === adminUserId && updateData.role === 'USER') {
          throw new Error('CANNOT_DEMOTE_SELF');
        }
      }

      // Verificar email único si se cambia
      if (updateData.email && updateData.email !== targetUser.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: updateData.email }
        });

        if (existingUser) {
          throw new Error('EMAIL_ALREADY_EXISTS');
        }
      }

      // Preparar datos de actualización
      const updatePayload = {};
      if (updateData.name) updatePayload.name = updateData.name;
      if (updateData.email) {
        updatePayload.email = updateData.email;
        updatePayload.emailVerified = false; // Requerir verificación
      }
      if (updateData.role) updatePayload.role = updateData.role;
      if (typeof updateData.isActive === 'boolean') updatePayload.isActive = updateData.isActive;

      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: updatePayload,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          updatedAt: true
        }
      });

      // Log cambio administrativo
      await auditService.logEvent({
        user_id: adminUserId,
        company_id: companyId,
        action: 'USER_UPDATED_BY_ADMIN',
        entity_type: 'user_account',
        entity_id: targetUserId,
        details: {
          ...auditContext,
          admin_role: adminRole,
          target_user_email: targetUser.email
        },
        changes: {
          before: {
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
            isActive: targetUser.isActive
          },
          after: {
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isActive: updatedUser.isActive
          }
        }
      });

      return updatedUser;

    } catch (error) {
      logger.error('Error updating user', {
        error: error.message,
        admin_id: adminUserId,
        target_user_id: targetUserId
      });
      throw error;
    }
  }

  /**
   *  Desactivar usuario (soft delete)
   * 
   * @param {string} adminUserId - ID del admin
   * @param {string} companyId - ID de la empresa
   * @param {string} adminRole - Rol del admin
   * @param {string} targetUserId - ID del usuario a desactivar
   * @param {Object} auditContext - Contexto para auditoría
   * @returns {Object} Usuario desactivado
   */
  async deactivateUser(adminUserId, companyId, adminRole, targetUserId, auditContext = {}) {
    try {
      // Verificar permisos
      if (!['COMPANY_ADMIN', 'SUPERADMIN'].includes(adminRole)) {
        throw new Error('INSUFFICIENT_PERMISSIONS');
      }

      // Obtener usuario objetivo
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          companyId: true
        }
      });

      if (!targetUser) {
        throw new Error('USER_NOT_FOUND');
      }

      // Validaciones de seguridad
      if (targetUserId === adminUserId) {
        throw new Error('CANNOT_DEACTIVATE_SELF');
      }

      if (adminRole !== 'SUPERADMIN' && targetUser.companyId !== companyId) {
        throw new Error('CROSS_COMPANY_ACCESS_DENIED');
      }

      if (!targetUser.isActive) {
        throw new Error('USER_ALREADY_INACTIVE');
      }

      // Desactivar usuario
      const deactivatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: {
          isActive: false,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          updatedAt: true
        }
      });

      // Log acción crítica
      await auditService.logSecurityEvent(
        adminUserId,
        companyId,
        'USER_DEACTIVATED',
        'MEDIUM',
        {
          ...auditContext,
          admin_role: adminRole,
          target_user_id: targetUserId,
          target_user_email: targetUser.email,
          target_user_role: targetUser.role
        }
      );

      return deactivatedUser;

    } catch (error) {
      logger.error('Error deactivating user', {
        error: error.message,
        admin_id: adminUserId,
        target_user_id: targetUserId
      });
      throw error;
    }
  }

  /**
   *  Reactivar usuario
   * 
   * @param {string} adminUserId - ID del admin
   * @param {string} companyId - ID de la empresa
   * @param {string} adminRole - Rol del admin
   * @param {string} targetUserId - ID del usuario a reactivar
   * @param {Object} auditContext - Contexto para auditoría
   * @returns {Object} Usuario reactivado
   */
  async reactivateUser(adminUserId, companyId, adminRole, targetUserId, auditContext = {}) {
    try {
      // Verificar permisos
      if (!['COMPANY_ADMIN', 'SUPERADMIN'].includes(adminRole)) {
        throw new Error('INSUFFICIENT_PERMISSIONS');
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId }
      });

      if (!targetUser) {
        throw new Error('USER_NOT_FOUND');
      }

      if (targetUser.isActive) {
        throw new Error('USER_ALREADY_ACTIVE');
      }

      const reactivatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: {
          isActive: true,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          updatedAt: true
        }
      });

      await auditService.logEvent({
        user_id: adminUserId,
        company_id: companyId,
        action: 'USER_REACTIVATED',
        entity_type: 'user_account',
        entity_id: targetUserId,
        details: {
          ...auditContext,
          admin_role: adminRole
        }
      });

      return reactivatedUser;

    } catch (error) {
      logger.error('Error reactivating user', {
        error: error.message,
        admin_id: adminUserId,
        target_user_id: targetUserId
      });
      throw error;
    }
  }

  /**
   *  Reset contraseña de usuario (solo admins)
   * 
   * @param {string} adminUserId - ID del admin
   * @param {string} companyId - ID de la empresa
   * @param {string} adminRole - Rol del admin
   * @param {string} targetUserId - ID del usuario
   * @param {Object} auditContext - Contexto para auditoría
   * @returns {Object} Nueva contraseña temporal
   */
  async resetUserPassword(adminUserId, companyId, adminRole, targetUserId, auditContext = {}) {
    try {
      // Verificar permisos
      if (!['COMPANY_ADMIN', 'SUPERADMIN'].includes(adminRole)) {
        throw new Error('INSUFFICIENT_PERMISSIONS');
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId }
      });

      if (!targetUser) {
        throw new Error('USER_NOT_FOUND');
      }

      // Generar nueva contraseña temporal
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const newPasswordHash = await bcrypt.hash(tempPassword, saltRounds);

      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          passwordHash: newPasswordHash,
          preferences: {
            ...targetUser.preferences,
            requirePasswordChange: true,
            passwordResetByAdmin: true
          },
          updatedAt: new Date()
        }
      });

      await auditService.logSecurityEvent(
        adminUserId,
        companyId,
        'PASSWORD_RESET_BY_ADMIN',
        'HIGH',
        {
          ...auditContext,
          admin_role: adminRole,
          target_user_id: targetUserId,
          target_user_email: targetUser.email
        }
      );

      return {
        temporaryPassword: tempPassword
      };

    } catch (error) {
      logger.error('Error resetting user password', {
        error: error.message,
        admin_id: adminUserId,
        target_user_id: targetUserId
      });
      throw error;
    }
  }
}

module.exports = new UserService();