const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const { authenticate } = require('../middleware/auth'); 
const { requireCompanyAdmin } = require('../middleware/rbac');

//  AUTHENTICATION ROUTES 
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, authController.changePassword);

//  USER PROFILE ROUTES  
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/profile/password', authenticate, userController.changePassword);
router.put('/profile/email', authenticate, userController.updateEmail);

// USER ADMIN ROUTES (usa userController refactorizado) 
router.get('/users', authenticate, requireCompanyAdmin, userController.getCompanyUsers);
router.post('/users', authenticate, requireCompanyAdmin, userController.createUser);
router.put('/users/:userId', authenticate, requireCompanyAdmin, userController.updateUser);
router.delete('/users/:userId', authenticate, requireCompanyAdmin, userController.deactivateUser);
router.post('/users/:userId/reactivate', authenticate, requireCompanyAdmin, userController.reactivateUser);
router.post('/users/:userId/reset-password', authenticate, requireCompanyAdmin, userController.resetUserPassword);

module.exports = router;