const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener reporte general
router.get('/general', reportsController.getGeneralReport);

// Exportar reporte a CSV - Comentado temporalmente hasta implementar
// router.get('/export', reportsController.exportReport);

module.exports = router; 