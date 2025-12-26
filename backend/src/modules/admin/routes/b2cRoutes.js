const express = require('express');
const router = express.Router();

const {
  listUsers,
  getUserDetail,
  getUserActivity,
  getB2CStats
} = require('../controllers/adminB2CController');

/**
 * @route GET /api/admin/b2c/stats
 * @desc Estadísticas globales de B2C
 * @access SuperAdmin
 */
router.get('/stats', getB2CStats);

/**
 * @route GET /api/admin/b2c/users
 * @desc Lista paginada de usuarios B2C
 * @access SuperAdmin
 * @query page, limit, search, status, sortBy, sortOrder
 */
router.get('/users', listUsers);

/**
 * @route GET /api/admin/b2c/users/:id
 * @desc Detalle de un usuario B2C
 * @access SuperAdmin
 */
router.get('/users/:id', getUserDetail);

/**
 * @route GET /api/admin/b2c/users/:id/activity
 * @desc Historial de actividad de un usuario
 * @access SuperAdmin
 */
router.get('/users/:id/activity', getUserActivity);

module.exports = router;
