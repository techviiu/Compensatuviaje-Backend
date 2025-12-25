/**
 * RUTAS B2C - Usuarios individuales (PROTEGIDAS)
 * 
 * Todas estas rutas requieren autenticación con Supabase.
 * El token de Supabase debe enviarse en el header:
 *   Authorization: Bearer <supabase_access_token>
 * 
 * Endpoints implementados:
 * - GET  /api/b2c/auth/me                    - Datos del usuario actual
 * - POST /api/b2c/auth/logout                - Cerrar sesión
 * - POST /api/b2c/payments/create-checkout   - Crear sesión de pago Stripe
 * - POST /api/b2c/payments/webhook           - Webhook de Stripe
 * - GET  /api/b2c/payments/history           - Historial de pagos
 * - GET  /api/b2c/payments/:sessionId/status - Estado de un pago
 * 
 * Endpoints pendientes:
 * - GET  /api/b2c/profile           - Mi perfil B2C
 * - PUT  /api/b2c/profile           - Actualizar perfil
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

// Controllers
const b2cAuthController = require('../controllers/b2cAuthController');
const b2cPaymentsController = require('../controllers/b2cPaymentsController');
const b2cCertificatesController = require('../controllers/b2cCertificatesController');

// ============================================
// RUTAS PÚBLICAS (Webhooks)
// ============================================

/**
 * POST /api/b2c/payments/webhook
 * Webhook de Stripe (no requiere autenticación)
 */
router.post('/payments/webhook', 
  express.raw({ type: 'application/json' }),
  b2cPaymentsController.handleWebhook
);

// ============================================
// RUTAS QUE REQUIEREN AUTENTICACIÓN
// ============================================

// Aplicar middleware de autenticación a todas las rutas siguientes
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

// ============================================
// RUTAS DE PAGOS (Stripe)
// ============================================

/**
 * POST /api/b2c/payments/create-checkout
 * Crear sesión de checkout de Stripe
 */
router.post('/payments/create-checkout', b2cPaymentsController.createCheckoutSession);

/**
 * GET /api/b2c/payments/history
 * Obtener historial de pagos del usuario
 */
router.get('/payments/history', b2cPaymentsController.getPaymentHistory);

/**
 * GET /api/b2c/payments/:sessionId/status
 * Obtener estado de un pago específico
 */
router.get('/payments/:sessionId/status', b2cPaymentsController.getPaymentStatus);

// ============================================
// RUTAS DE CERTIFICADOS
// ============================================

/**
 * GET /api/b2c/certificates
 * Listar todos los certificados del usuario
 */
router.get('/certificates', b2cCertificatesController.listCertificates);

/**
 * GET /api/b2c/certificates/:id
 * Obtener detalles de un certificado específico
 */
router.get('/certificates/:id', b2cCertificatesController.getCertificate);

/**
 * GET /api/b2c/certificates/:id/download
 * Descargar certificado en formato HTML/PDF
 */
router.get('/certificates/:id/download', b2cCertificatesController.downloadCertificate);

// ============================================
// ESTADO DEL MÓDULO
// ============================================

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
      'Calculadora de huella de carbono ✅',
      'Integración con Stripe para pagos ✅',
      'Dashboard completo ✅',
      'Mis viajes/vuelos ✅',
      'Proyectos ambientales ✅',
      'Certificados ✅'
    ],
    pendingFeatures: [
      'Generación de PDF de certificados',
      'Sistema de badges',
      'Ranking entre usuarios',
      'Exportar reportes'
    ]
  });
});

module.exports = router;
