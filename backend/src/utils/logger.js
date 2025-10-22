/**
 * 🛠️ LOGGER UTILITY
 * 
 * ¿Qué hace?
 * - Sistema centralizado de logging para toda la aplicación
 * - Diferentes niveles de log (debug, info, warn, error)
 * - Formateo consistente de mensajes
 * - Rotación de archivos para evitar llenar disco
 * 
 * ¿Por qué es crítico?
 * - Debugging: Rastrear problemas en producción
 * - Monitoring: Detectar patrones y tendencias
 * - Compliance: Evidencia de operaciones del sistema
 * - Performance: Identificar operaciones lentas
 * 
 * ¿Cómo se conecta?
 * - Todos los módulos importan logger para registrar eventos
 * - Middleware registra requests automáticamente
 * - Services registran operaciones importantes
 * - Controllers registran errores y éxitos
 */

const winston = require('winston');
const path = require('path');

/**
 * 📊 Configuración de niveles de log
 * 
 * ¿Qué significa cada nivel?
 * - error: Errores críticos que requieren atención inmediata
 * - warn: Situaciones anómalas pero no críticas
 * - info: Información general de operaciones
 * - debug: Información detallada para desarrollo
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**
 * 🎨 Formato personalizado para logs
 * 
 * Incluye timestamp, nivel, mensaje y metadatos en formato legible
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }), // Incluir stack trace en errores
  winston.format.json(), // Formato JSON para parsing fácil
  winston.format.prettyPrint() // Formato legible para desarrollo
);

/**
 * 📁 Configuración de archivos de log
 * 
 * ¿Por qué separar por nivel?
 * - Errores van a archivo separado para revisión rápida
 * - Logs generales van a archivo combinado
 * - Rotación automática previene archivos gigantes
 */
const createLogger = () => {
  // 📂 Asegurar que directorio de logs existe
  const logsDir = path.join(__dirname, '../../../logs');
  
  const transports = [
    // 🖥️ Console para desarrollo
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.colorize(), // Colores para consola
        winston.format.simple()    // Formato simple para consola
      )
    }),

    // 📄 Archivo para todos los logs
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'info',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,      // Mantener 5 archivos rotados
    }),

    // 🚨 Archivo separado para errores
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,      // Mantener 5 archivos rotados
    })
  ];

  // 📊 En producción, agregar transporte para servicios externos
  if (process.env.NODE_ENV === 'production') {
    // 💡 Aquí podrías agregar transportes para:
    // - Elasticsearch/Kibana
    // - CloudWatch
    // - Sentry para errores
    // - Slack para alertas críticas
  }

  return winston.createLogger({
    levels: logLevels,
    format: logFormat,
    transports: transports,
    // 🚫 No salir del proceso en errores no manejados
    exitOnError: false
  });
};

const logger = createLogger();

/**
 * 🔧 Wrapper functions para uso más fácil
 * 
 * Estas funciones agregan contexto automático y validan entrada
 */

/**
 * Log de información general
 */
const info = (message, meta = {}) => {
  logger.info(message, {
    ...meta,
   
  });
};

/**
 * Log de advertencias
 */
const warn = (message, meta = {}) => {
  logger.warn(message, {
    ...meta,

  });
};

/**
 * Log de errores
 */
const error = (message, meta = {}) => {
  logger.error(message, {
    ...meta,
    // 💡 En errores, siempre incluir información del ambiente
    environment: process.env.NODE_ENV || 'development',
    node_version: process.version
  });
};

/**
 * Log de debugging (solo en desarrollo)
 */
const debug = (message, meta = {}) => {
  if (process.env.LOG_LEVEL === 'debug') {
    logger.debug(message, {
      ...meta,
    
    });
  }
};

/**
 * 🚨 Log de eventos de seguridad (siempre se registra)
 */
const security = (message, meta = {}) => {
  logger.warn(`[SECURITY] ${message}`, {
    ...meta,
  
    security_event: true,
    
  });
};

/**
 * 📊 Log de performance (para optimización)
 */
const performance = (operation, duration, meta = {}) => {
  const level = duration > 1000 ? 'warn' : 'info'; // Warn si toma más de 1 segundo
  
  logger[level](`[PERFORMANCE] ${operation} took ${duration}ms`, {
    ...meta,
    operation: operation,
    duration_ms: duration,
   
  });
};

/**
 * 🔍 Log de requests HTTP (para middleware)
 */
const request = (req, res, duration) => {
  const level = res.statusCode >= 400 ? 'warn' : 'info';
  
  logger[level](`${req.method} ${req.path} - ${res.statusCode}`, {
    method: req.method,
    path: req.path,
    status_code: res.statusCode,
    duration_ms: duration,
    ip: req.ip || req.connection?.remoteAddress,
    user_agent: req.get('User-Agent'),
    user_id: req.user?.user_id,
    company_id: req.user?.company_id,
   
    component: 'http'
  });
};

/**
 * 💾 Log de operaciones de base de datos
 */
const database = (operation, query, duration, meta = {}) => {
  debug(`[DATABASE] ${operation}`, {
    ...meta,
    operation: operation,
    query: query,
    duration_ms: duration,
    component: 'database'
  });
};

/**
 * 🧹 Helper para sanitizar datos sensibles antes de loggear
 */
const sanitizeForLog = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session'
  ];

  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * 📤 Exportar funciones del logger
 */
module.exports = {
  // Funciones principales
  info,
  warn,
  error,
  debug,
  
  // Funciones especializadas
  security,
  performance,
  request,
  database,
  
  // Utilities
  sanitizeForLog,
  
  // Logger original para casos avanzados
  logger
};