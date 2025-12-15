const express = require('express');

const companyRoutes = require('./companyRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const documentRoutes = require('./documentRoutes');
const userRoutes = require('./userRoutes');
const profileRoutes = require('./profileRoutes');

const { authenticate } = require('../../auth/middleware/auth');
const { requireCompanyContext } = require('../../shared/middleware/companyContext');

const router = express.Router();

// Todas las rutas B2B requieren autenticación
router.use(authenticate);

// Verificar que el usuario tiene contexto de empresa
router.use(requireCompanyContext);


// Perfil del usuario autenticado
router.use('/profile', profileRoutes);

// Gestión de MI empresa
router.use('/company', companyRoutes);

// Dashboard de MI empresa
router.use('/dashboard', dashboardRoutes);

// Documentos de MI empresa
router.use('/documents', documentRoutes);

// Usuarios de MI empresa (solo Company Admin)
router.use('/users', userRoutes);

module.exports = router;
