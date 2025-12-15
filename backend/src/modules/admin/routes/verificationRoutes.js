const express = require('express');
const rateLimit = require('express-rate-limit');
const verificationController = require('../../onboard/controllers/verificationController');

const router = express.Router();

const verificationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Demasiadas verificaciones, intenta en 5 minutos'
  }
});

/**
 * Obtener verificaciones pendientes
 * GET /api/admin/verification/pending
 */
router.get('/pending', verificationController.getPendingVerifications);

router.get('/stats', verificationController.getVerificationStats);
router.put('/domains/:id/verify',
  verificationRateLimit,
  verificationController.verifyDomain
);

module.exports = router;
