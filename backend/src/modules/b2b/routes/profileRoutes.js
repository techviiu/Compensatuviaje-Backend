const express = require('express');
const userController = require('../../auth/controllers/userController');
const authController = require('../../auth/controllers/authController');

const router = express.Router();
/**
 * Obtener mi perfil
 * GET /api/b2b/profile
 */
router.get('/', userController.getProfile);
router.put('/', userController.updateProfile);

router.put('/password', userController.changePassword);

router.put('/email', userController.updateEmail);

router.get('/me', authController.me);

router.post('/logout', authController.logout);

module.exports = router;
