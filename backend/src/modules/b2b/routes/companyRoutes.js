const express = require('express');
const companyController = require('../../onboard/controllers/companyController');
const verificationController = require('../../onboard/controllers/verificationController');
const { requirePermissions } = require('../../auth/middleware/rbac');

const router = express.Router();

/**
 * Obtener información de mi empresa
 * GET /api/b2b/company
 */
router.get('/', 
  requirePermissions(['companies.read']),
  companyController.getCompany
);

router.put('/',
  requirePermissions(['companies.update']),
  companyController.updateCompany
);

router.get('/domains',
  requirePermissions(['companies.read']),
  verificationController.listCompanyDomains
);

router.post('/domains',
  requirePermissions(['companies.update']),
  verificationController.addDomain
);
router.post('/validate-email',
  requirePermissions(['companies.read']),
  verificationController.validateCorporateEmail
);

module.exports = router;
