const { PrismaClient } = require('@prisma/client');
const logger = require('../../../utils/logger');

const prisma = new PrismaClient();

class AuditService {
  /**
   *  Registrar evento genérico de auditoría
   * 
   * @param {Object} eventData - Datos del evento
   * @param {string} eventData.user_id - ID del usuario que ejecuta la acción
   * @param {string} eventData.company_id - ID de la empresa (scope)
   * @param {string} eventData.action - Acción realizada (LOGIN_SUCCESS, CREATE_CERTIFICATE, etc.)
   * @param {string} eventData.entity_type - Tipo de entidad afectada (user, company, certificate, etc.)
   * @param {string} eventData.entity_id - ID específico de la entidad
   * @param {Object} eventData.details - Detalles adicionales del evento (JSON)
   * @param {Object} eventData.changes - Cambios realizados (antes/después)
   * 
   */
  async logEvent(eventData) {
    try {
      // 1️ Validar datos requeridos
      if (!eventData.action || !eventData.entity_type) {
        logger.warn('Audit event missing required fields', { eventData });
        return false;
      }

      // 2️ Preparar datos para insert
      const auditData = {
        action: eventData.action,
        entityType: eventData.entity_type,
        entityId: eventData.entity_id && eventData.entity_id !== 'unknown' ? eventData.entity_id : undefined,
        changesJson: JSON.stringify({
          details: eventData.details || {},
          changes: eventData.changes || {},
          timestamp: new Date().toISOString(),
          system_info: {
            node_env: process.env.NODE_ENV,
            version: process.env.APP_VERSION || '1.0.0'
          }
        })
      };

      // Agregar actor si existe
      if (eventData.user_id) {
        auditData.actor = { connect: { id: eventData.user_id } };
      }

      logger.info("❌Esto lo que tengo en auditLog", auditData)
      // 3️ Insertar en base de datos
      const result = await prisma.auditLog.create({
        data: auditData
      });

      if (process.env.LOG_LEVEL === 'debug') {
        logger.debug('Audit event recorded', {
          audit_id: result.id,
          action: eventData.action,
          user_id: eventData.user_id,
          entity_type: eventData.entity_type
        });
      }

      return result.id;

    } catch (error) {
      logger.error('Failed to record audit event', {
        error: error.message,
        stack: error.stack,
        event_data: eventData
      });

      // Retornar false pero NO lanzajr error
      // ¿Por qué? Porque audit no debe romper funcionalidad principal
      return false;
    }
  }

  /**
   * Registrar eventos de autenticación
   * 
   * Wrapper especializado para eventos de auth
   * Incluye campos específicos de seguridad
   */
  async logAuthEvent(userId, companyId, action, details = {}) {
    try {
      return await this.logEvent({
        user_id: userId,
        company_id: companyId,
        action: action,
        entity_type: 'authentication',
        entity_id: userId,
        details: {
          // Información de seguridad estándar
          ip: details.ip || 'unknown',
          user_agent: details.user_agent || 'unknown',
          session_duration: details.session_duration,
          remember_me: details.remember_me,
          
          // Información adicional de contexto
          login_method: details.login_method || 'password',
          risk_factors: details.risk_factors || [],
          
          // Para debugging
          ...details
        }
      });

    } catch (error) {
      logger.error('Failed to log auth event', {
        error: error.message,
        user_id: userId,
        action: action
      });
      return false;
    }
  }

  /**
   *  Registrar cambios en datos de empresa
   * 
   * Para rastrear modificaciones en información corporativa crítica
   */
  async logCompanyChange(userId, companyId, action, entityId, oldData, newData, details = {}) {
    try {
      return await this.logEvent({
        user_id: userId,
        company_id: companyId,
        action: action,
        entity_type: 'company_data',
        entity_id: entityId,
        details: details,
        changes: {
          before: oldData,
          after: newData,
          //  Calcular campos que cambiaron para análisis rápido
          changed_fields: this.getChangedFields(oldData, newData)
        }
      });

    } catch (error) {
      logger.error('Failed to log company change', {
        error: error.message,
        user_id: userId,
        company_id: companyId,
        action: action
      });
      return false;
    }
  }

  /**
   *  Registrar eventos de seguridad
   * 
   * Para actividad sospechosa, intentos de acceso no autorizado, etc.
   */
  async logSecurityEvent(userId, companyId, action, severity, details = {}) {
    try {
      const auditId = await this.logEvent({
        user_id: userId || 'SYSTEM',
        company_id: companyId,
        action: action,
        entity_type: 'security',
        entity_id: userId || 'unknown',
        details: {
          severity: severity, // LOW, MEDIUM, HIGH, CRITICAL
          threat_level: details.threat_level || 'unknown',
          affected_resources: details.affected_resources || [],
          mitigation_actions: details.mitigation_actions || [],
          ...details
        }
      });

      // Para eventos de alta severidad, también log directo
      if (severity === 'HIGH' || severity === 'CRITICAL') {
        logger.warn('High severity security event', {
          audit_id: auditId,
          user_id: userId,
          action: action,
          severity: severity,
          details: details
        });
      }

      return auditId;

    } catch (error) {
      logger.error('Failed to log security event', {
        error: error.message,
        user_id: userId,
        action: action,
        severity: severity
      });
      return false;
    }
  }

  /**
   *  Obtener historial de auditoría para una entidad
   * 
   * Para mostrar el historial de cambios en interfaces de admin
   */
  async getEntityAuditHistory(entityType, entityId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        startDate = null,
        endDate = null,
        actions = null,
        userId = null
      } = options;

      // Construir filtros dinámicamente
      const where = {
        entityType: entityType,
        entityId: entityId
      };

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate
        };
      }

      if (actions && Array.isArray(actions)) {
        where.action = {
          in: actions
        };
      }

      if (userId) {
        where.actorUserId = userId;
      }

      const history = await prisma.auditLog.findMany({
        where: where,
        orderBy: {
          createdAt: 'desc' // Más reciente primero
        },
        take: limit,
        skip: offset,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      // Parsear JSON y agregar información útil
      const formattedHistory = history.map(log => ({
        id: log.id,
        action: log.action,
        created_at: log.createdAt,
        actor: log.actor,
        details: JSON.parse(log.changesJson || '{}'),
        //  Campo útil para UI: resumen legible del cambio
        summary: this.generateChangeSummary(log.action, log.changesJson)
      }));

      return formattedHistory;

    } catch (error) {
      logger.error('Failed to get audit history', {
        error: error.message,
        entity_type: entityType,
        entity_id: entityId
      });
      return [];
    }
  }

  /**
   * Obtener estadísticas de auditoría
   * 
   * Para dashboards de admin y reportes de compliance
   */
  async getAuditStats(companyId, timeRange = '7d') {
    try {
      // Calcular fecha de inicio según rango
      const now = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '1d':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      //  Obtener estadísticas agregadas
      const [
        totalEvents,
        authEvents,
        securityEvents,
        userActivity,
        topActions
      ] = await Promise.all([
        // Total de eventos
        prisma.auditLog.count({
          where: {
            companyId: companyId,
            createdAt: { gte: startDate }
          }
        }),

        // Eventos de autenticación
        prisma.auditLog.count({
          where: {
            companyId: companyId,
            entityType: 'authentication',
            createdAt: { gte: startDate }
          }
        }),

        // Eventos de seguridad
        prisma.auditLog.count({
          where: {
            companyId: companyId,
            entityType: 'security',
            createdAt: { gte: startDate }
          }
        }),

        // Actividad por usuario
        prisma.auditLog.groupBy({
          by: ['actorUserId'],
          where: {
            companyId: companyId,
            actorUserId: { not: null },
            createdAt: { gte: startDate }
          },
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 10
        }),

        // Top acciones
        prisma.auditLog.groupBy({
          by: ['action'],
          where: {
            companyId: companyId,
            createdAt: { gte: startDate }
          },
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 10
        })
      ]);

      return {
        total_events: totalEvents,
        auth_events: authEvents,
        security_events: securityEvents,
        user_activity: userActivity,
        top_actions: topActions,
        time_range: timeRange,
        start_date: startDate,
        end_date: now
      };

    } catch (error) {
      logger.error('Failed to get audit stats', {
        error: error.message,
        company_id: companyId,
        time_range: timeRange
      });
      return null;
    }
  }

  /**
   *  HELPER: Detectar campos que cambiaron
   * 
   * Compara objeto antes/después y retorna lista de campos modificados
   */
  getChangedFields(oldData, newData) {
    if (!oldData || !newData) return [];

    const changedFields = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      if (oldData[key] !== newData[key]) {
        changedFields.push({
          field: key,
          old_value: oldData[key],
          new_value: newData[key]
        });
      }
    }

    return changedFields;
  }

  /**
   * HELPER: Generar resumen legible del cambio
   * 
   * Para mostrar en UI de manera user-friendly
   */
  generateChangeSummary(action, changesJson) {
    try {
      const changes = JSON.parse(changesJson || '{}');
      
      // Mapeo de acciones a descripciones legibles
      const actionDescriptions = {
        'LOGIN_SUCCESS': 'Usuario inició sesión',
        'LOGIN_FAILURE': 'Intento de login fallido',
        'LOGOUT': 'Usuario cerró sesión',
        'PASSWORD_CHANGED': 'Contraseña modificada',
        'USER_CREATED': 'Usuario creado',
        'USER_UPDATED': 'Usuario actualizado',
        'USER_DEACTIVATED': 'Usuario desactivado',
        'CERTIFICATE_GENERATED': 'Certificado generado',
        'CERTIFICATE_REVOKED': 'Certificado revocado',
        'MANIFEST_UPLOADED': 'Manifiesto cargado',
        'PRICING_UPDATED': 'Precios actualizados'
      };

      let summary = actionDescriptions[action] || action;

      // Agregar información específica si está disponible
      if (changes.details) {
        if (changes.details.ip) {
          summary += ` desde IP ${changes.details.ip}`;
        }
        if (changes.changed_fields && changes.changed_fields.length > 0) {
          const fieldNames = changes.changed_fields.map(f => f.field).join(', ');
          summary += ` (campos: ${fieldNames})`;
        }
      }

      return summary;

    } catch (error) {
      return action; // Fallback al action raw
    }
  }

  /**
   *  Limpiar logs antiguos 
   * 
   * MVP: Función preparada para cuando se implemente limpieza automática
   */
  async cleanupOldLogs(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedCount = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          NOT: {
            entityType: 'security'
          }
        }
      });

      logger.info('Audit logs cleanup completed', {
        deleted_count: deletedCount.count,
        cutoff_date: cutoffDate,
        retention_days: retentionDays
      });

      return deletedCount.count;

    } catch (error) {
      logger.error('Failed to cleanup audit logs', {
        error: error.message,
        retention_days: retentionDays
      });
      return 0;
    }
  }
}

module.exports = new AuditService();
