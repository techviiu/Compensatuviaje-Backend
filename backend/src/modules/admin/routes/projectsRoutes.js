const express = require('express');
const router = express.Router();

const {
  listProjects,
  getProjectDetail,
  createProject,
  updateProject,
  changeProjectStatus,
  deleteProject,
  addEvidence,
  deleteEvidence,
  getPricingHistory,
  addPricing,
  activatePricing,
  getProjectsStats
} = require('../controllers/adminProjectsController');

/**
 * @route GET /api/admin/projects/stats
 * @desc Estadísticas globales de proyectos
 * @access SuperAdmin
 */
router.get('/stats', getProjectsStats);

/**
 * @route GET /api/admin/projects
 * @desc Lista paginada de proyectos
 * @access SuperAdmin
 * @query page, limit, search, status, projectType, country, sortBy, sortOrder
 */
router.get('/', listProjects);

/**
 * @route POST /api/admin/projects
 * @desc Crear nuevo proyecto ESG
 * @access SuperAdmin
 */
router.post('/', createProject);

/**
 * @route GET /api/admin/projects/:id
 * @desc Detalle de un proyecto
 * @access SuperAdmin
 */
router.get('/:id', getProjectDetail);

/**
 * @route PUT /api/admin/projects/:id
 * @desc Actualizar proyecto
 * @access SuperAdmin
 */
router.put('/:id', updateProject);

/**
 * @route PUT /api/admin/projects/:id/status
 * @desc Cambiar estado del proyecto
 * @access SuperAdmin
 */
router.put('/:id/status', changeProjectStatus);

/**
 * @route DELETE /api/admin/projects/:id
 * @desc Eliminar proyecto (soft delete)
 * @access SuperAdmin
 */
router.delete('/:id', deleteProject);

/**
 * @route GET /api/admin/projects/:id/pricing
 * @desc Historial de precios del proyecto
 * @access SuperAdmin
 */
router.get('/:id/pricing', getPricingHistory);

/**
 * @route POST /api/admin/projects/:id/pricing
 * @desc Agregar nueva versión de precio
 * @access SuperAdmin
 */
router.post('/:id/pricing', addPricing);

/**
 * @route PUT /api/admin/projects/:id/pricing/:pricingId/activate
 * @desc Activar una versión de precio específica
 * @access SuperAdmin
 */
router.put('/:id/pricing/:pricingId/activate', activatePricing);

/**
 * @route POST /api/admin/projects/:id/evidences
 * @desc Agregar evidencia al proyecto
 * @access SuperAdmin
 */
router.post('/:id/evidences', addEvidence);

/**
 * @route DELETE /api/admin/projects/:id/evidences/:evidenceId
 * @desc Eliminar evidencia del proyecto
 * @access SuperAdmin
 */
router.delete('/:id/evidences/:evidenceId', deleteEvidence);

module.exports = router;
