const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticateToken);
router.use(requireRole('admin'));

// Obtener estadísticas del sistema
router.get('/stats', adminController.getSystemStats);

// Obtener información del sistema
router.get('/system-info', adminController.getSystemInfo);

// Crear backup del sistema
router.post('/backup', adminController.createBackup);

// Limpiar logs del sistema
router.post('/clear-logs', adminController.clearLogs);

module.exports = router;
