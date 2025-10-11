const App = require('./src/app');
const logger = require('./src/utils/logger');

// Log de configuración inicial
logger.info('Starting CompensaTuViaje Backend', {
  environment: process.env.NODE_ENV,
  node_version: process.version,
  port: process.env.PORT,
  timestamp: new Date().toISOString()
});

// Inicializar y arrancar aplicación
try {
  const app = new App();
  app.start();
} catch (error) {
  logger.error('Failed to start application', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
}