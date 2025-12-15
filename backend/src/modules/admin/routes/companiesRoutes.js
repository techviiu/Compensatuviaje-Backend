const express = require('express');
const rateLimit = require('express-rate-limit');
const companyController = require('../../onboard/controllers/companyController');

const router = express.Router();

const statusChangeRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Demasiados cambios de estado, intenta en 5 minutos'
  }
});

router.get('/', companyController.listCompanies);

router.get('/stats', companyController.getOnboardingStats);

router.get('/:id', companyController.getCompany);

router.put('/:id/status',
  statusChangeRateLimit,
  companyController.changeCompanyStatus
);

module.exports = router;
