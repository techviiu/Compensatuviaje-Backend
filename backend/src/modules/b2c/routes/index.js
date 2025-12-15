/**
 * RUTAS B2C - Usuarios individuales
 * Te las encargo Matias 👌
 * 
 * Requiere: Supabase AuthToken
 * Acceso: Usuarios que se registran con Google/Email
 * 
 * TODO: Implementar cuando se integre Supabase Auth
 * 
 * Endpoints planificados:
 * - POST /api/b2c/auth/callback     - Callback de Supabase
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
 * - POST /api/b2c/share             - Compartir logro
 */

const express = require('express');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Módulo B2C en desarrollo',
    status: 'coming_soon',
    plannedFeatures: [
      'Registro con Google OAuth',
      'Calculadora de huella personal',
      'Compensación individual',
      'Certificados personales',
      'Sistema de badges',
      'Ranking entre usuarios',
      'Viajes guardados'
    ]
  });
});

module.exports = router;
