const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticateToken);
router.use(requireRole('admin'));

// Obtener lista de barberos
router.get('/', employeeController.getEmployees);

// Obtener estadísticas de barberos
router.get('/stats', employeeController.getEmployeeStats);

// Cambiar estado de barbero
router.put('/:employeeId/status', employeeController.toggleEmployeeStatus);

// Cambiar rol de barbero
router.put('/:employeeId/role', employeeController.changeEmployeeRole);

module.exports = router;
