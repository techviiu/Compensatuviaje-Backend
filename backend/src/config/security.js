/**
 * 🛡️ CONFIGURACIÓN DE SEGURIDAD
 * 
 * Centraliza todas las configuraciones relacionadas con seguridad
 */

module.exports = {
  // 🔐 Bcrypt para hashear passwords
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  },

  // 🚦 Rate Limiting - Prevenir ataques de fuerza bruta
  rateLimit: {
    // Login attempts
    loginMaxAttempts: parseInt(process.env.LOGIN_ATTEMPTS_MAX) || 5,
    loginLockoutMinutes: parseInt(process.env.LOGIN_LOCKOUT_MINUTES) || 15,
    
    // API calls
    apiWindowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 900000, // 15 min
    apiMaxRequests: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // 📝 Política de contraseñas
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false // Para MVP, en V1 será true
  },

  // 🕒 Configuración de sesiones
  session: {
    maxConcurrentSessions: 5, // Máx sesiones simultáneas por usuario
    idleTimeoutMinutes: 30    // Timeout por inactividad
  }
};