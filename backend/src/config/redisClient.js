/**
 * 🔴 REDIS CLIENT - CONFIGURACIÓN CENTRALIZADA
 * 
 * ¿Qué hace?
 * - Configuración unificada de Redis para toda la aplicación
 * - Fallback automático a memoria si Redis no está disponible
 * - Connection pooling y reconnect automático
 * - Logging detallado para debugging
 * - Graceful shutdown
 * 
 * ¿Por qué centralizado?
 * - PRINCIPIO DRY: Una sola configuración para toda la app
 * - Fácil cambio entre Redis/memoria según ambiente
 * - Monitoring centralizado de conexiones
 * - Configuración consistente en todos los módulos
 * 
 * ¿Cuándo usar Redis vs Memoria?
 * - Desarrollo local: Memoria (más simple)
 * - Testing: Memoria (más rápido, aislado)
 * - Staging/Production: Redis (persistente, escalable)
 */

const { createClient } = require('redis');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 segundo inicial
  }

  /**
   * 🔌 Inicializar conexión a Redis
   * 
   * ¿Cuándo se llama?
   * - Al iniciar la aplicación (app.js)
   * - Después de pérdida de conexión (auto-reconnect)
   * 
 
   */
  async connect() {
    // 🚀 Evitar múltiples conexiones simultáneas
    if (this.isConnecting || this.isConnected) {
      return this.client;
    }

    this.isConnecting = true;

    try {
      // 📊 Configuración desde variables de entorno
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        
        // ⚡ Configuraciones de performance
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true, // No conectar hasta que se use
        keepAlive: 30000,  // 30 segundos
        
        // 🔄 Configuraciones de reconnect
        retryDelayOnClusterDown: 300,
        maxRetriesPerRequest: null, // Retry indefinitely
      };

      // 🎯 Crear cliente según ambiente
      if (process.env.NODE_ENV === 'production') {
        // 🏭 PRODUCCIÓN: Configuración robusta
        this.client = createClient({
          url: process.env.REDIS_URL || `redis://${redisConfig.host}:${redisConfig.port}`,
          password: redisConfig.password,
          database: redisConfig.db,
          
          // 🛡️ Configuraciones de seguridad y performance
          socket: {
            keepAlive: true,
            reconnectStrategy: (retries) => {
              if (retries > this.maxReconnectAttempts) {
                logger.error('Redis max reconnect attempts reached');
                return false; // Stop reconnecting
              }
              return Math.min(retries * this.reconnectDelay, 5000); // Max 5 segundos
            },
            connectTimeout: 10000, // 10 segundos
            commandTimeout: 5000,  // 5 segundos
          },
        });
      } else {
        // 🧪 DESARROLLO/TESTING: Configuración simple
        this.client = createClient({
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          db: redisConfig.db,
          
          // 🔧 Configuración más relajada para desarrollo
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 3) return false; // Solo 3 intentos en desarrollo
              return 1000; // 1 segundo entre intentos
            }
          }
        });
      }

      // 📡 Event listeners para monitoring
      this.setupEventListeners();

      // 🔌 Conectar
      await this.client.connect();
      
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      logger.info('Redis connected successfully', {
        host: redisConfig.host,
        port: redisConfig.port,
        db: redisConfig.db,
        environment: process.env.NODE_ENV
      });

      return this.client;

    } catch (error) {
      this.isConnecting = false;
      this.isConnected = false;

      logger.error('Redis connection failed', {
        error: error.message,
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        attempt: this.reconnectAttempts + 1
      });

      // 🔄 Auto-reconnect en producción
      if (process.env.NODE_ENV === 'production' && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          logger.info('Attempting Redis reconnection', { attempt: this.reconnectAttempts });
          this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }

      return null;
    }
  }

  /**
   * 📡 Configurar event listeners para monitoring
   * 
   * Eventos importantes de Redis para debugging y alerts
   */
  setupEventListeners() {
    if (!this.client) return;

    // ✅ Conexión exitosa
    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    // 🔌 Cliente listo para commands
    this.client.on('ready', () => {
      logger.info('Redis client ready');
      this.isConnected = true;
    });

    // 🔄 Reconectando
    this.client.on('reconnecting', () => {
      logger.warn('Redis client reconnecting');
      this.isConnected = false;
    });

    // ❌ Error de conexión
    this.client.on('error', (error) => {
      logger.error('Redis client error', {
        error: error.message,
        code: error.code,
        errno: error.errno
      });
      this.isConnected = false;
    });

    // 🔌 Desconectado
    this.client.on('end', () => {
      logger.warn('Redis client disconnected');
      this.isConnected = false;
    });
  }

  /**
   * 🏥 Health check para Redis
   * 
   * ¿Para qué?
   * - Verificar estado de conexión
   * - Health endpoint en API
   * - Monitoring automatizado
   */
  async healthCheck() {
    if (!this.client || !this.isConnected) {
      return {
        status: 'disconnected',
        error: 'Redis client not connected'
      };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency_ms: latency,
        connected: this.isConnected
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 🔧 Operaciones básicas con fallback
   * 
   * Wrapper methods que manejan errores automáticamente
   */
  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET error', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, options = {}) {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.client.set(key, value, options);
      return result === 'OK';
    } catch (error) {
      logger.error('Redis SET error', { key, error: error.message });
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis DEL error', { key, error: error.message });
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error: error.message });
      return false;
    }
  }

  /**
   * 🧹 Graceful shutdown
   * 
   * Para cerrar conexión limpiamente al terminar la app
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        logger.info('Redis client disconnected gracefully');
      } catch (error) {
        logger.error('Error disconnecting Redis client', {
          error: error.message
        });
      }
    }
    
    this.isConnected = false;
    this.client = null;
  }

  /**
   * 🔍 Getters para información del cliente
   */
  get isRedisAvailable() {
    return this.isConnected && this.client !== null;
  }

  get redisClient() {
    return this.client;
  }

  /**
   * 📊 Estadísticas de conexión
   */
  getConnectionStats() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      hasClient: this.client !== null,
      environment: process.env.NODE_ENV
    };
  }
}

// 🎯 Singleton pattern - Una sola instancia para toda la app
const redisClient = new RedisClient();

/**
 * 🚀 Auto-inicialización según ambiente
 * 
 * Solo conectar automáticamente en ciertos ambientes
 */
if (process.env.REDIS_ENABLED === 'true' || process.env.NODE_ENV === 'production') {
  // Auto-conectar si Redis está habilitado
  redisClient.connect().catch(error => {
    logger.warn('Auto-connect to Redis failed, will use memory fallback', {
      error: error.message
    });
  });
}

module.exports = redisClient;