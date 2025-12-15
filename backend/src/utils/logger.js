const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};


const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * 📂 Verificar si podemos escribir archivos de log
 */
const canWriteLogs = () => {
  try {
    const logsDir = path.join(__dirname, '../../../logs');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Verificar si podemos escribir
    fs.accessSync(logsDir, fs.constants.W_OK);
    return true;
  } catch (error) {
    console.warn('⚠️  No se pueden crear archivos de log. Solo se usará console.');
    return false;
  }
};

const createLogger = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = !isProduction;
  
  // 🔧 En producción (SeeNode): SOLO Console (stdout/stderr)
  // 🔧 En desarrollo: Console + File
  const transports = [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        isProduction 
          ? winston.format.json() // JSON para logs de producción (mejor para SeeNode)
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                return `${timestamp} [${level}]: ${message} ${metaStr}`;
              })
            )
      ),
      handleExceptions: true,
      handleRejections: true
    })
  ];

  // Solo archivos de log en desarrollo
  if (isDevelopment && canWriteLogs()) {
    const logsDir = path.join(__dirname, '../../../logs');
    
    try {
      transports.push(
        new winston.transports.File({
          filename: path.join(logsDir, 'app.log'),
          level: 'info',
          format: logFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          format: logFormat,
          maxsize: 5242880,
          maxFiles: 5
        })
      );
    } catch (error) {
      console.warn('⚠️  No se pudieron crear archivos de log:', error.message);
    }
  }

  return winston.createLogger({
    levels: logLevels,
    format: logFormat,
    transports: transports,
    exitOnError: false
  });
};

const logger = createLogger();

/**
 *  Wrapper functions
 */
const info = (message, meta = {}) => {
  logger.info(message, { ...meta });
};

const warn = (message, meta = {}) => {
  logger.warn(message, { ...meta });
};

const error = (message, meta = {}) => {
  logger.error(message, {
    ...meta,
    environment: process.env.NODE_ENV || 'development',
    node_version: process.version
  });
};

const debug = (message, meta = {}) => {
  if (process.env.LOG_LEVEL === 'debug') {
    logger.debug(message, { ...meta });
  }
};

const security = (message, meta = {}) => {
  logger.warn(`[SECURITY] ${message}`, {
    ...meta,
    security_event: true
  });
};

const performance = (operation, duration, meta = {}) => {
  const level = duration > 1000 ? 'warn' : 'info';
  
  logger[level](`[PERFORMANCE] ${operation} took ${duration}ms`, {
    ...meta,
    operation,
    duration_ms: duration
  });
};

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

const database = (operation, query, duration, meta = {}) => {
  debug(`[DATABASE] ${operation}`, {
    ...meta,
    operation,
    query,
    duration_ms: duration,
    component: 'database'
  });
};

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

module.exports = {
  info,
  warn,
  error,
  debug,
  security,
  performance,
  request,
  database,
  sanitizeForLog,
  logger
};