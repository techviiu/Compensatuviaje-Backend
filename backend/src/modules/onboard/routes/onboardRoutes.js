const express = require('express');
const rateLimit = require('express-rate-limit');

// Importar rutas específicas
const companyRoutes = require('./companyRoutes');
const documentRoutes = require('./documentRoutes');
const verificationRoutes = require('./verificationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const companyController = require('../controllers/companyController')

// Middleware
const { authMiddleware } = require('../../auth/middleware/auth');

const router = express.Router();

// Rate limiting específico para onboarding
const onboardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta nuevamente en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting más estricto para registro de empresas
const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 5 registros por hora por IP
  message: {
    success: false,
    message: 'Límite de registros alcanzado, intenta nuevamente en 1 hora'
  }
});

// Aplicar rate limiting general
router.use(onboardRateLimit);

// ==========================================
// RUTAS PÚBLICAS(sin autenticación)
// ==========================================

router.post('/companies', registrationRateLimit, companyController.registerCompany);

// Middleware de autenticación para rutas protegidas
router.use(authMiddleware);


// ==========================================
// RUTAS PROTEGIDAS
// ==========================================


// Rutas protegidas - Companies
router.use('/companies', companyRoutes);

// Rutas protegidas - Documents
router.use('/documents', documentRoutes);
router.use('/companies/:id/documents', documentRoutes);

// Rutas protegidas - Verification
router.use('/admin/verification', verificationRoutes);
router.use('/companies/:id/domains', verificationRoutes);
router.use('/validate', verificationRoutes);

// Rutas protegidas - Dashboard
router.use('/dashboard', dashboardRoutes);

// Ruta de configuración general
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      module: 'MOD-ONBOARD',
      features: [
        'Registro empresarial con validación RUT',
        'Upload documentos legales',
        'Verificación dominios corporativos',
        'Workflow de estados automatizado',
        'Dashboard progreso en tiempo real'
      ],
      limits: {
        registrationsPerHour: 5,
        requestsPerWindow: 100,
        maxFileSize: '10MB',
        allowedDocumentTypes: ['PDF', 'JPG', 'PNG', 'DOC', 'DOCX']
      }
    }
  });
});

module.exports = router;