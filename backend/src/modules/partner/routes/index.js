/**
 * Endpoints planificados:
 * - POST /api/partner/auth/login    - Login de partner
 * - GET  /api/partner/profile       - Perfil del partner
 * - GET  /api/partner/projects      - Mis proyectos ESG
 * - POST /api/partner/projects      - Crear proyecto
 * - PUT  /api/partner/projects/:id  - Actualizar proyecto
 * - POST /api/partner/reports       - Subir reporte de impacto
 * - GET  /api/partner/stats         - Estadísticas de mis proyectos
 * - GET  /api/partner/payments      - Pagos recibidos
 * 
 * Primero acavamos con los perfiles más importantes
 */

const express = require('express');

// Middleware (por implementar)
// const { authenticatePartner } = require('../../shared/middleware/partnerAuth');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Módulo Partner en desarrollo',
    status: 'coming_soon',
    plannedFeatures: [
      'Gestión de proyectos ESG',
      'Reportes de impacto ambiental',
      'Dashboard de compensaciones recibidas',
      'Certificaciones de proyecto',
      'Métricas y estadísticas'
    ]
  });
});

module.exports = router;
