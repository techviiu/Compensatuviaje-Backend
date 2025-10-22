const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const logger = require('./src/utils/logger');
const { PrismaClient } = require('@prisma/client');

// Importar rutas
const authRoutes = require('./src/modules/auth/routes/authRoutes');
const onboardRoutes = require('./src/modules/onboard/routes/onboardRoutes');

const app = express();
const prisma = new PrismaClient();

// ==========================================
// CONFIGURACIÓN BÁSICA
// ==========================================

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compresión
app.use(compression());

// Trust proxy
app.set('trust proxy', 1);

// ==========================================
// SEGURIDAD
// ==========================================

// Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));

// Headers adicionales
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ==========================================
// LOGGING
// ==========================================

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: {
      write: (message) => logger.info(message.trim())
    },
    skip: (req) => req.url === '/health'
  }));
}

// ==========================================
// ARCHIVOS ESTÁTICOS
// ==========================================

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// ==========================================
// RUTAS
// ==========================================

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      success: false,
      status: 'unhealthy'
    });
  }
});

// Info API
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: {
      app: 'CompensaTuViaje API',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV,
      modules: ['auth', 'onboard']
    }
  });
});

// Rutas de módulos
app.use('/api/auth', authRoutes);
app.use('/api/onboard', onboardRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.path
  });
});

// ==========================================
// MANEJO DE ERRORES
// ==========================================

// Error de JSON inválido
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido'
    });
  }
  next(err);
});

// Error general
app.use((err, req, res, next) => {
  logger.error('Server error', {
    error: err.message,
    stack: err.stack,
    url: req.url
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
    
    if (server) {
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Errores no capturados
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message });
  process.exit(1);
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(' Server started', {
    port: PORT,
    host: HOST,
    environment: process.env.NODE_ENV,
    node_version: process.version,
    pid: process.pid
  });

  if (process.env.NODE_ENV === 'development') {
    logger.info(' Available routes:', {
      health: 'GET /health',
      info: 'GET /api/info',
      auth: 'POST /api/auth/login',
      onboard: 'POST /api/onboard/companies'
    });
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  } else {
    logger.error(' Server error', { error: error.message });
  }
  process.exit(1);
});

// Exportar para testing
module.exports = app;