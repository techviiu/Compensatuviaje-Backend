const express = require('express');
const companiesRoutes = require('./companiesRoutes');
const verificationRoutes = require('./verificationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const { authenticate } = require('../../auth/middleware/auth');
const { requireSuperAdmin } = require('../../shared/middleware/superAdmin');

const router = express.Router();

// Todas las rutas Admin requieren autenticación
router.use(authenticate);

// Todas las rutas Admin requieren ser SuperAdmin
router.use(requireSuperAdmin);


// Gestión de TODAS las empresas
router.use('/companies', companiesRoutes);

// Verificaciones pendientes
router.use('/verification', verificationRoutes);

// Dashboard administrativo
router.use('/dashboard', dashboardRoutes);

module.exports = router;
