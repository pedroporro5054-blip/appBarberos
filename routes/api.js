const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken } = require('../middleware/auth');

// Ruta para reportes generales con filtros por período
router.get('/reports/general', authenticateToken, reportsController.getGeneralReport);

// Ruta temporal para pruebas (sin autenticación)
router.get('/reports/test', (req, res) => {
    res.json({
        success: true,
        message: 'Endpoint de reportes funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
