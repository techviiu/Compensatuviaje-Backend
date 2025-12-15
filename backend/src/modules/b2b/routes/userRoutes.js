const express = require('express');
const userController = require('../../auth/controllers/userController');
const { requireCompanyAdmin } = require('../../auth/middleware/rbac');

const router = express.Router();

// Todas las rutas requieren ser Company Admin
router.use(requireCompanyAdmin);

/**
 * Listar usuarios de mi empresa
 * GET /api/b2b/users
 */
router.get('/', userController.getCompanyUsers);

router.post('/', userController.createUser);
router.put('/:userId', userController.updateUser);
router.delete('/:userId', userController.deactivateUser);
router.post('/:userId/reactivate', userController.reactivateUser);
router.post('/:userId/reset-password', userController.resetUserPassword);

module.exports = router;
