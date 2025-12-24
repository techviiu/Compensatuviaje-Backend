const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../../auth/controllers/authController');
const companyController = require('../../onboard/controllers/companyController');
const verificationController = require('../../onboard/controllers/verificationController');
const documentController = require('../../onboard/controllers/documentController');
const airportController = require('../../shared/airports/controllers/airportController');
const calculatorController = require('../../shared/calculator/controllers/calculatorController');
const router = express.Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación, intenta en 15 minutos'
  }
});

const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: {
    success: false,
    message: 'Límite de registros alcanzado, intenta en 1 hora'
  }
});

const validationRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Demasiadas validaciones, intenta en 1 minuto'
  }
});

/**
 * Login de usuario B2B (empresa)
 * POST /api/public/auth/login
 */
router.post('/auth/login', authRateLimit, authController.login);

router.post('/auth/refresh', authRateLimit, authController.refresh);

router.post('/companies/register', registrationRateLimit, companyController.registerCompany);

router.post('/validate/airport-code', validationRateLimit, verificationController.validateAirportCode);

router.get('/validate/domain-info/:domain', validationRateLimit, verificationController.getDomainInfo);

router.get('/config/documents', documentController.getDocumentConfig);

router.get('/config/onboard', (req, res) => {
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
        registrationsPerHour: 10,
        requestsPerWindow: 100,
        maxFileSize: '10MB',
        allowedDocumentTypes: ['PDF', 'JPG', 'PNG', 'DOC', 'DOCX']
      }
    }
  });
});

/**
 * Ejemplos:
 * - /api/public/airports/search?q=scl       → Por código IATA
 * - /api/public/airports/search?q=santiago  → Por ciudad
 * - /api/public/airports/search?q=chile     → Por país (todos de Chile)
 * - /api/public/airports/search?q=santaigo  → Tolera typos!
 */
router.get('/airports/search', airportController.searchAirports);

/**
 * /api/public/airports/SCL
 */
router.get('/airports/:code', airportController.getByCode);



/**
 * Calcular emisiones de vuelo
 * POST /api/public/calculator/estimate
 * Body: { origin, destination, cabinCode, passengers, roundTrip, userId? }
 */
router.post('/calculator/estimate', calculatorController.calculateEstimate);

module.exports = router;
