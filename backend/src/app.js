/**
 * 🚀 APLICACIÓN PRINCIPAL - COMPENSATUVIAJE BACKEND
 * 
 * ¿Qué hace este archivo?
 * - Configura Express.js con todos los middlewares necesarios
 * - Establece rutas principales y manejo de errores
 * - Inicializa conexiones a bases de datos y servicios externos
 * - Configura seguridad, logging y auditoría
 * - Orquesta todos los módulos de la aplicación
 * 
 * ¿Por qué esta estructura?
 * - Configuración centralizada y ordenada
 * - Fácil mantenimiento y debugging
 * - Escalabilidad para agregar nuevos módulos
 * - Separación clara de responsabilidades
 * 
 * 🏗️ ARQUITECTURA:
 * app.js -> routes -> controllers -> services -> database
 *         -> middleware -> validators -> utils
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Utilidades internas
const logger = require('./utils/logger');
const { PrismaClient } = require('@prisma/client');

// Middlewares de autenticación
const { authenticate } = require('./modules/auth/middleware/auth');
const { checkPermission, checkRole } = require('./modules/auth/middleware/rbac');
const { createDynamicRateLimit, loginRateLimit } = require('./modules/auth/middleware/rateLimiter');

// Rutas principales
const authRoutes = require('./modules/auth/routes/authRoutes');

// Servicios para health checks
const auditService = require('./modules/auth/services/auditService');

/**
 * 🔧 CONFIGURACIÓN PRINCIPAL DE EXPRESS
 */
class App {
  constructor() {
    this.app = express();
    this.prisma = new PrismaClient();
    
    // Inicializar configuración en orden específico
    this.setupBasicMiddleware();
    this.setupSecurityMiddleware(); 
    this.setupLoggingMiddleware();
    this.setupRateLimiting();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupGracefulShutdown();
  }

  /**
   * 🔧 Middleware básico de Express
   */
  setupBasicMiddleware() {
    // 1️⃣ Parsing de requests
    this.app.use(express.json({ 
      limit: '10mb',  // Límite para uploads de manifiestos
      type: 'application/json'
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    this.app.use(compression({
      threshold: 1024, 
      level: 6         // Nivel de compresión balanceado
    }));

    // 3️⃣ Servir archivos estáticos (para certificados PDF, etc.)
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
      maxAge: '1d',           // Cache por 1 día
      etag: true,             // ETags para cache inteligente
      lastModified: true,
      setHeaders: (res, path, stat) => {
        // Solo servir archivos seguros
        if (path.endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
        }
        // Prevenir ejecución de scripts
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
    }));

    // 4️⃣ Configurar información de confianza para proxies
    this.app.set('trust proxy', process.env.TRUST_PROXY || 1);
  }

  /**
   * 🛡️ Middleware de seguridad
   */
  setupSecurityMiddleware() {
    // 1️⃣ Helmet para headers de seguridad básicos
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Para Tailwind en desarrollo
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Necesario para some PDF viewers
    }));

    // 2️⃣ CORS configurado para frontend específico
    const corsOptions = {
      origin: (origin, callback) => {
        // Lista de dominios permitidos
        const allowedOrigins = [
          'http://localhost:3000',     // React dev
          'http://localhost:5173',     // Vite dev
          'https://compensatuviaje.com', // Producción
          'https://app.compensatuviaje.com' // App producción
        ];

        // Permitir requests sin origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          logger.warn('CORS blocked request', { origin });
          return callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,              // Permitir cookies
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin'
      ],
      exposedHeaders: ['X-Total-Count'], // Para paginación
      maxAge: 86400 // Cache preflight por 24 horas
    };

    this.app.use(cors(corsOptions));

    // 3️⃣ Middleware para agregar headers de seguridad adicionales
    this.app.use((req, res, next) => {
      // Prevenir clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Prevenir MIME sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // XSS Protection (legacy, pero útil)
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Referrer policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Cache control por defecto (se puede override en rutas específicas)
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      next();
    });
  }

  /**
   * 📝 Configuración de logging
   */
  setupLoggingMiddleware() {
    // 1️⃣ Morgan para logs de HTTP requests
    const morganFormat = process.env.NODE_ENV === 'production' 
      ? 'combined'  // Formato completo para producción
      : 'dev';      // Formato colorido para desarrollo

    this.app.use(morgan(morganFormat, {
      stream: {
        write: (message) => {
          // Enviar logs de HTTP a nuestro logger estructurado
          logger.info('HTTP Request', { 
            message: message.trim(),
            type: 'http_access'
          });
        }
      },
      // No logear requests de health check para evitar spam
      skip: (req, res) => {
        return req.url === '/health' || req.url === '/metrics';
      }
    }));

    // 2️⃣ Middleware para agregar request ID único (útil para debugging)
    this.app.use((req, res, next) => {
      req.requestId = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
      
      // Agregar request ID a headers de respuesta
      res.setHeader('X-Request-ID', req.requestId);
      
      // Agregar request ID al request para logging posterior
      req.requestId = req.requestId;
      
      next();
    });

    // 3️⃣ Log de requests con información de seguridad
    this.app.use((req, res, next) => {
      // Log solo requests importantes, no estáticos
      if (!req.url.startsWith('/uploads') && 
          !req.url.startsWith('/favicon') && 
          req.url !== '/health') {
        
        logger.info('Request received', {
          request_id: req.requestId,
          method: req.method,
          url: req.url,
          ip: req.ip,
          user_agent: req.get('User-Agent'),
          referer: req.get('Referer'),
          content_type: req.get('Content-Type'),
          content_length: req.get('Content-Length')
        });
      }
      
      next();
    });
  }

  /**
   * 🚦 Configuración de rate limiting
   */
  setupRateLimiting() {
    // 1️⃣ Rate limiter general (para todas las rutas)
    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 1000,                 // 1000 requests por IP por ventana
      message: {
        success: false,
        message: 'Demasiadas solicitudes, intenta más tarde'
      },
      standardHeaders: true,     // Incluir headers rate limit info
      legacyHeaders: false,      // Deshabilitar headers legacy
      skip: (req) => {
        // Skip rate limiting para IPs de confianza (load balancers, etc.)
        const trustedIPs = (process.env.TRUSTED_IPS || '').split(',');
        return trustedIPs.includes(req.ip);
      },
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          url: req.url,
          user_agent: req.get('User-Agent')
        });
        
        res.status(429).json({
          success: false,
          message: 'Demasiadas solicitudes, intenta más tarde',
          retry_after: Math.round(req.rateLimit.resetTime / 1000)
        });
      }
    });

    this.app.use(generalLimiter);

    // 2️⃣ Rate limiter específico para authentication
    this.app.use('/api/auth', createDynamicRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 20,                  // 20 requests por ventana para auth
      prefix: 'auth_rl'
    }));

    // 3️⃣ Rate limiter para uploads (más restrictivo)
    const uploadLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 50,                  // 50 uploads por hora
      message: {
        success: false,
        message: 'Límite de uploads excedido, intenta en 1 hora'
      }
    });

    this.app.use('/api/uploads', uploadLimiter);
  }

  /**
   * 🛣️ Configuración de rutas principales
   */
  setupRoutes() {
    // 1️⃣ Health check endpoint (siempre debe estar disponible)
    this.app.get('/health', async (req, res) => {
      try {
        // Verificar conexión a base de datos
        await this.prisma.$queryRaw`SELECT 1`;
        
        res.json({
          success: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          version: process.env.APP_VERSION || '1.0.0',
          uptime: process.uptime(),
          memory: process.memoryUsage()
        });
      } catch (error) {
        logger.error('Health check failed', { error: error.message });
        
        res.status(503).json({
          success: false,
          status: 'unhealthy',
          error: 'Database connection failed'
        });
      }
    });

    // 2️⃣ API de información básica (sin autenticación)
    this.app.get('/api/info', (req, res) => {
      res.json({
        success: true,
        data: {
          app_name: 'CompensaTuViaje API',
          version: process.env.APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV,
          features: ['authentication', 'file-upload', 'certificate-generation', 'pricing-calculation'],
          docs_url: process.env.API_DOCS_URL || '/docs'
        }
      });
    });

    // 3️⃣ Rutas de autenticación (sin autenticación requerida)
    this.app.use('/api/auth', authRoutes);

    // 4️⃣ Rutas protegidas que requieren autenticación
    this.app.use('/api/protected', authenticate);
    
    // Test endpoint para verificar autenticación
    this.app.get('/api/protected/test', (req, res) => {
      res.json({
        success: true,
        message: 'Autenticación exitosa',
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          company: req.user.companyId
        }
      });
    });

    // 5️⃣ Rutas de administración (requieren rol específico)
    this.app.use('/api/admin', authenticate, checkRole(['COMPANY_ADMIN', 'SUPER_ADMIN']));
    
    this.app.get('/api/admin/stats', async (req, res) => {
      try {
        // Ejemplo de endpoint de admin que usa auditService
        const stats = await auditService.getAuditStats(req.user.companyId);
        
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        logger.error('Error getting admin stats', { error: error.message });
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      }
    });

    // 6️⃣ Endpoint para testing de RBAC
    this.app.get('/api/admin/users', 
      authenticate, 
      checkPermission('users:read'),
      (req, res) => {
        res.json({
          success: true,
          message: 'Permisos de usuarios validados',
          permissions: req.user.permissions
        });
      }
    );

    // 🔮 FUTURAS RUTAS (preparadas para expansión)
    // this.app.use('/api/uploads', uploadRoutes);       // Gestión de archivos
    // this.app.use('/api/certificates', certRoutes);    // Generación de certificados
    // this.app.use('/api/pricing', pricingRoutes);      // Cálculos de pricing
    // this.app.use('/api/companies', companyRoutes);    // Gestión de empresas
    // this.app.use('/api/projects', projectRoutes);     // Gestión de proyectos ESG

    // 7️⃣ Manejo de rutas no encontradas
    this.app.use((req, res) => {
      logger.warn('Route not found', { 
        url: req.originalUrl, 
        method: req.method,
        ip: req.ip 
      });
      
      res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        requested_url: req.originalUrl,
        available_endpoints: [
          'GET /health',
          'GET /api/info', 
          'POST /api/auth/login',
          'POST /api/auth/refresh',
          'GET /api/protected/test'
        ]
      });
    });
  }

  /**
   * ⚠️ Manejo centralizado de errores
   */
  setupErrorHandling() {
    // 1️⃣ Manejo de errores de parsing JSON
    this.app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        logger.warn('Invalid JSON in request', { 
          error: err.message,
          ip: req.ip,
          url: req.url 
        });
        
        return res.status(400).json({
          success: false,
          message: 'JSON inválido en el request'
        });
      }
      next(err);
    });

    // 2️⃣ Manejo de errores de CORS
    this.app.use((err, req, res, next) => {
      if (err.message === 'Not allowed by CORS') {
        logger.warn('CORS error', { 
          origin: req.get('Origin'),
          ip: req.ip 
        });
        
        return res.status(403).json({
          success: false,
          message: 'Origen no permitido por CORS'
        });
      }
      next(err);
    });

    // 3️⃣ Manejo de errores de Prisma
    this.app.use((err, req, res, next) => {
      if (err.code && err.code.startsWith('P')) { // Prisma error codes start with P
        logger.error('Database error', { 
          error: err.message,
          code: err.code,
          meta: err.meta 
        });
        
        // No exponer detalles de BD en producción
        const message = process.env.NODE_ENV === 'production' 
          ? 'Error de base de datos'
          : `Database error: ${err.message}`;
        
        return res.status(500).json({
          success: false,
          message: message
        });
      }
      next(err);
    });

    // 4️⃣ Manejo general de errores no capturados
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      // En desarrollo, mostrar stack trace
      const errorResponse = {
        success: false,
        message: process.env.NODE_ENV === 'production' 
          ? 'Error interno del servidor'
          : err.message
      };

      if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
      }

      res.status(err.statusCode || 500).json(errorResponse);
    });

    // 5️⃣ Manejo de promesas rechazadas no capturadas
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection', {
        reason: reason,
        promise: promise
      });
      
      // En producción, cerrar gracefully
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });

    // 6️⃣ Manejo de excepciones no capturadas
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
      });
      
      process.exit(1); // Siempre salir en este caso
    });
  }

  /**
   * 🔄 Configuración de graceful shutdown
   */
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);
      
      try {
        // 1️⃣ Cerrar conexión a base de datos
        await this.prisma.$disconnect();
        logger.info('Database connections closed');
        
        // 2️⃣ Cerrar servidor HTTP
        if (this.server) {
          await new Promise((resolve) => {
            this.server.close(resolve);
          });
          logger.info('HTTP server closed');
        }
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
        
      } catch (error) {
        logger.error('Error during graceful shutdown', { error: error.message });
        process.exit(1);
      }
    };

    // Registrar handlers para diferentes señales
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * 🚀 Iniciar servidor
   */
  start() {
    const PORT = process.env.PORT || 3001;
    const HOST = process.env.HOST || '0.0.0.0';

    this.server = this.app.listen(PORT, HOST, () => {
      logger.info('Server started successfully', {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV,
        node_version: process.version,
        pid: process.pid
      });

      // Log de configuración importante en desarrollo
      if (process.env.NODE_ENV === 'development') {
        logger.info('Development mode configuration', {
          cors_enabled: true,
          rate_limiting: true,
          debug_logging: true,
          trust_proxy: process.env.TRUST_PROXY || 1
        });
      }
    });

    // Manejo de errores del servidor
    this.server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        logger.error('Server error', { error: error.message });
        throw error;
      }
    });

    return this.app;
  }

  /**
   * 🧪 Método para testing (no inicia servidor)
   */
  getApp() {
    return this.app;
  }
}

// 🎯 INICIALIZACIÓN
if (require.main === module) {
  // Solo iniciar servidor si este archivo se ejecuta directamente
  const app = new App();
  app.start();
} else {
  // Si se importa como módulo (para testing), solo exportar la clase
  module.exports = App;
}

module.exports = App;