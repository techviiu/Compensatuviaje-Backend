/**
 * RUTAS B2C - Usuarios individuales (PROTEGIDAS)
 * 
 * Todas estas rutas requieren autenticación con Supabase.
 * El token de Supabase debe enviarse en el header:
 *   Authorization: Bearer <supabase_access_token>
 * 
 * Endpoints implementados:
 * - GET  /api/b2c/auth/me           - Datos del usuario actual
 * - POST /api/b2c/auth/logout       - Cerrar sesión
 * 
 * Endpoints pendientes:
 * - GET  /api/b2c/profile           - Mi perfil B2C
 * - PUT  /api/b2c/profile           - Actualizar perfil
 * - POST /api/b2c/calculator        - Calcular huella
 * - GET  /api/b2c/calculations      - Mis cálculos
 * - POST /api/b2c/compensate        - Compensar emisiones
 * - GET  /api/b2c/certificates      - Mis certificados
 * - GET  /api/b2c/badges            - Mis badges
 * - GET  /api/b2c/ranking           - Ranking B2C
 * - POST /api/b2c/trips             - Guardar viaje
 * - GET  /api/b2c/trips             - Mis viajes guardados
 */

const express = require('express');
const router = express.Router();

// Middleware de autenticación B2C
const { authenticateB2c } = require('../middleware/authenticateB2c');

// Controller de autenticación
const b2cAuthController = require('../controllers/b2cAuthController');

// ============================================
// RUTAS QUE REQUIEREN AUTENTICACIÓN
// ============================================

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateB2c);

/**
 * GET /api/b2c/auth/me
 * Obtener datos del usuario autenticado
 */
router.get('/auth/me', b2cAuthController.getMe);

/**
 * POST /api/b2c/auth/logout
 * Cerrar sesión (principalmente informativo)
 */
router.post('/auth/logout', b2cAuthController.logout);

/**
 * GET /api/b2c/status
 * Estado del módulo B2C
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Módulo B2C activo',
    status: 'active',
    user: {
      id: req.b2cUser.id,
      email: req.b2cUser.email,
      nombre: req.b2cUser.nombre
    },
    availableFeatures: [
      'Autenticación con Google OAuth ✅',
      'Perfil de usuario',
      'Calculadora de huella personal',
      'Compensación individual',
      'Certificados personales',
      'Sistema de badges',
      'Ranking entre usuarios',
      'Viajes guardados'
    ],
    pendingFeatures: [
      'Integración con Stripe para pagos',
      'Dashboard completo',
      'Exportar reportes'
    ]
  });
});

module.exports = router;
