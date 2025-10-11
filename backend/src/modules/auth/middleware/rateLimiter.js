/**
 * 🚦 RATE LIMITER MIDDLEWARE
 * 
 * ¿Qué hace?
 * - Limita número de requests por IP/usuario en ventana de tiempo
 * - Previene ataques de fuerza bruta y DoS
 * - Diferentes límites para diferentes tipos de endpoints
 * - Headers informativos para el cliente
 * 
 * ¿Por qué es crítico?
 * - Protección contra ataques automatizados
 * - Preservar recursos del servidor
 * - Mejorar experiencia para usuarios legítimos
 * - Cumplir SLA de disponibilidad
 * 
 * ¿Cómo se conecta?
 * - Se aplica ANTES de controllers en rutas sensibles
 * - Login endpoints tienen límites más estrictos
 * - API endpoints tienen límites generales
 * - Admin endpoints tienen límites más relajados
 */

const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const logger = require('../../../utils/logger');
const redisClient = require('../../../config/redisClient');

/**
 * 🌐 Helper para manejar IPv6 correctamente
 * 
 * express-rate-limit requiere este helper para IPv6
 */
const ipKeyGenerator = (req) => {
  // Usar el helper interno de express-rate-limit para IPv6
  return req.ip || req.connection.remoteAddress || 'unknown';
};


/**
 * 🔧 CONFIGURACIÓN PARA MVP
 * 
 * Usando memory store para simplicidad
 * En producción se puede agregar Redis
 */

/**
 * 🔑 Rate Limiter para LOGIN (más estricto)
 * 
 * ¿Por qué más estricto?
 * - Login es vector principal de ataques de fuerza bruta
 * - Credenciales incorrectas no deben saturar sistema
 * - Dar tiempo para que atacantes se desistan
 */
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos por IP en 15 minutos
  
  // 📊 Store: Redis si está disponible, memoria como fallback
  store: redisClient.isRedisAvailable ? new RedisStore({
    sendCommand: (...args) => redisClient.redisClient.sendCommand(args),
    prefix: 'login_rl:'
  }) : undefined,

  // 🔍 Identificación de cliente
  keyGenerator: (req) => {
    // Usar helper IPv6-safe para obtener IP
    const ip = ipKeyGenerator(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}:${Buffer.from(userAgent).toString('base64').substring(0, 20)}`;
  },

  // 📝 Mensaje de respuesta
  message: {
    success: false,
    error_code: 'RATE_LIMIT_EXCEEDED',
    error_message: 'Demasiados intentos de login. Intente nuevamente en 15 minutos.',
    retry_after: 15 * 60, // segundos
    max_attempts: 5
  },

  // 📊 Headers informativos
  standardHeaders: true, // Incluir `RateLimit-*` headers
  legacyHeaders: false,  // Deshabilitar `X-RateLimit-*` headers (deprecated)

  // 🚨 Handler cuando se excede límite
  handler: (req, res) => {
    const ip = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Logging cuando se excede el límite (reemplaza onLimitReached deprecated)
    logger.security('Login rate limit exceeded', {
      ip: ip,
      user_agent: userAgent,
      path: req.path,
      attempts_in_window: req.rateLimit.totalHits,
      window_remaining_ms: req.rateLimit.msBeforeNext,
      total_hits: req.rateLimit.totalHits
    });

    res.status(429).json({
      success: false,
      error_code: 'RATE_LIMIT_EXCEEDED',
      error_message: 'Demasiados intentos de login. Intente nuevamente en 15 minutos.',
      retry_after: Math.ceil(req.rateLimit.msBeforeNext / 1000),
      attempts_remaining: 0
    });
  }
});

/**
 * 🌐 Rate Limiter para API general (más permisivo)
 * 
 * Para endpoints normales de la aplicación
 */
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por IP en 15 minutos
  
  store: redisClient.isRedisAvailable ? new RedisStore({
    sendCommand: (...args) => redisClient.redisClient.sendCommand(args),
    prefix: 'api_rl:'
  }) : undefined,

  keyGenerator: (req) => {
    // Si está autenticado, usar user_id + company_id
    if (req.user) {
      return `user:${req.user.user_id}:${req.user.company_id}`;
    }
    // Si no, usar IP con helper IPv6-safe
    return ipKeyGenerator(req);
  },

  message: {
    success: false,
    error_code: 'API_RATE_LIMIT_EXCEEDED',
    error_message: 'Demasiadas requests. Intente nuevamente en unos minutos.',
    retry_after: 15 * 60
  },

  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      user_id: req.user?.user_id,
      company_id: req.user?.company_id,
      path: req.path,
      method: req.method,
      user_agent: req.get('User-Agent')
    });

    res.status(429).json({
      success: false,
      error_code: 'API_RATE_LIMIT_EXCEEDED',
      error_message: 'Demasiadas requests. Intente nuevamente en unos minutos.',
      retry_after: Math.ceil(req.rateLimit.msBeforeNext / 1000)
    });
  }
});

/**
 * 👨‍💼 Rate Limiter para endpoints de ADMIN (más relajado)
 * 
 * Admins necesitan más flexibilidad para operaciones masivas
 */
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // Máximo 300 requests por admin en 15 minutos
  
  store: redisClient.isRedisAvailable ? new RedisStore({
    sendCommand: (...args) => redisClient.redisClient.sendCommand(args),
    prefix: 'admin_rl:'
  }) : undefined,

  keyGenerator: (req) => {
    return `admin:${req.user?.user_id || ipKeyGenerator(req)}`;
  },

  message: {
    success: false,
    error_code: 'ADMIN_RATE_LIMIT_EXCEEDED',
    error_message: 'Límite de requests de admin excedido.',
    retry_after: 15 * 60
  },

  // ✅ Solo aplicar si NO es admin del sistema
  skip: (req) => {
    return req.user && req.user.role === 'admin_system';
  },

  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 🐌 Slow Down Middleware (complemento al rate limiting)
 * 
 * ¿Qué hace?
 * - En lugar de bloquear completamente, ralentiza respuestas
 * - Permite requests pero las hace más lentas progresivamente
 * - Desalienta ataques sin romper completamente la funcionalidad
 * 
 * NOTA: Para MVP usamos solo rate limiting básico
 * En producción se puede agregar express-slow-down
 */
const loginSlowDown = (req, res, next) => {
  // MVP: Solo pasar al siguiente middleware
  // En producción: implementar slowDown real
  next();
};

/* IMPLEMENTACIÓN FUTURA CON express-slow-down:
const slowDown = require('express-slow-down');
const loginSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 3, // Ralentizar después del 3er intento
  delayMs: 500,  // Incrementar 500ms por cada request adicional
  maxDelayMs: 5000, // Máximo 5 segundos de delay
  
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return ip;
  },

  // 📝 Logging cuando se aplica ralentización
  onLimitReached: (req, res) => {
    logger.warn('Login slow down applied', {
      ip: req.ip,
      path: req.path,
      delay_ms: req.slowDown.delay,
      hits: req.slowDown.totalHits
    });
  }
});
*/

/**
 * 🔧 Rate Limiter dinámico basado en tipo de endpoint
 * 
 * Aplica diferentes límites según el tipo de operación
 */
const createDynamicRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    prefix = 'dynamic_rl',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return rateLimit({
    windowMs,
    max,
    skipSuccessfulRequests, // No contar requests exitosos
    skipFailedRequests,     // No contar requests fallidos

    store: redisClient.isRedisAvailable ? new RedisStore({
      sendCommand: (...args) => redisClient.redisClient.sendCommand(args),
      prefix: `${prefix}:`
    }) : undefined,

    keyGenerator: (req) => {
      // Estrategia híbrida: user_id si está auth, IP si no
      if (req.user) {
        return `user:${req.user.user_id}`;
      }
      return ipKeyGenerator(req);
    },

    message: {
      success: false,
      error_code: 'RATE_LIMIT_EXCEEDED',
      error_message: 'Demasiadas requests para este endpoint.',
      retry_after: Math.ceil(windowMs / 1000)
    },

    standardHeaders: true,
    legacyHeaders: false
  });
};

/**
 * 📊 Middleware para logging de rate limit info
 * 
 * Agrega información de rate limiting a logs para análisis
 */
const rateLimitLogger = (req, res, next) => {
  // Solo logguear si hay información de rate limit
  if (req.rateLimit) {
    const rateLimitInfo = {
      limit: req.rateLimit.limit,
      current: req.rateLimit.current,
      remaining: req.rateLimit.remaining,
      reset_time: new Date(req.rateLimit.resetTime)
    };

    // Agregar info al request para uso posterior
    req.rateLimitInfo = rateLimitInfo;

    // Log si está cerca del límite
    if (req.rateLimit.remaining < 10) {
      logger.warn('Rate limit approaching', {
        ip: req.ip,
        user_id: req.user?.user_id,
        path: req.path,
        remaining: req.rateLimit.remaining,
        limit: req.rateLimit.limit
      });
    }
  }

  next();
};

/**
 * 🧹 Helper para resetear rate limit de un usuario específico
 * 
 * Útil para admin que quiere liberar un usuario bloqueado
 */
const resetUserRateLimit = async (userId, prefix = 'api_rl') => {
  if (!redisClient.isRedisAvailable) {
    logger.warn('Cannot reset rate limit without Redis client');
    return false;
  }

  try {
    const key = `${prefix}:user:${userId}`;
    await redisClient.del(key);
    
    logger.info('Rate limit reset for user', {
      user_id: userId,
      prefix: prefix
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to reset user rate limit', {
      error: error.message,
      user_id: userId
    });
    return false;
  }
};

module.exports = {
  // Rate limiters principales
  loginRateLimit,
  apiRateLimit,
  adminRateLimit,
  
  // Slow down
  loginSlowDown,
  
  // Utilities
  createDynamicRateLimit,
  rateLimitLogger,
  resetUserRateLimit
};
