const express = require('express');
const companiesRoutes = require('./companiesRoutes');
const verificationRoutes = require('./verificationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const b2cRoutes = require('./b2cRoutes');
const projectsRoutes = require('./projectsRoutes');
const reportsRoutes = require('./reportsRoutes');
const { authenticate } = require('../../auth/middleware/auth');
const { requireSuperAdmin } = require('../../shared/middleware/superAdmin');

const router = express.Router();

// Todas las rutas Admin requieren autenticación
router.use(authenticate);

// Todas las rutas Admin requieren ser SuperAdmin
router.use(requireSuperAdmin);

// Dashboard administrativo principal
router.use('/dashboard', dashboardRoutes);

// Gestión de TODAS las empresas B2B
router.use('/companies', companiesRoutes);

// Gestión de usuarios B2C
router.use('/b2c', b2cRoutes);

// Gestión de proyectos ESG
router.use('/projects', projectsRoutes);

// Reportes y exportaciones
router.use('/reports', reportsRoutes);

// Verificaciones pendientes
router.use('/verification', verificationRoutes);

module.exports = router;
