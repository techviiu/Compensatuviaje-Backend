const express = require('express');
const router = express.Router();

const {
  getEmissionsReport,
  getFinancialReport,
  getCompaniesReport,
  getB2CReport,
  exportReport
} = require('../controllers/adminReportsController');

/**
 * @route GET /api/admin/reports/emissions
 * @desc Reporte de emisiones
 * @access SuperAdmin
 * @query period, groupBy, projectId, companyId, dateFrom, dateTo
 */
router.get('/emissions', getEmissionsReport);

/**
 * @route GET /api/admin/reports/financial
 * @desc Reporte financiero
 * @access SuperAdmin
 * @query period, groupBy, currency, companyId, projectId, dateFrom, dateTo
 */
router.get('/financial', getFinancialReport);

/**
 * @route GET /api/admin/reports/companies
 * @desc Reporte de empresas
 * @access SuperAdmin
 * @query period, status, industry, dateFrom, dateTo
 */
router.get('/companies', getCompaniesReport);

/**
 * @route GET /api/admin/reports/b2c
 * @desc Reporte de usuarios B2C
 * @access SuperAdmin
 * @query period, country, dateFrom, dateTo
 */
router.get('/b2c', getB2CReport);

/**
 * @route GET /api/admin/reports/export
 * @desc Exportar reporte a CSV/Excel/PDF
 * @access SuperAdmin
 * @query reportType, format, period, dateFrom, dateTo
 */
router.get('/export', exportReport);

module.exports = router;
