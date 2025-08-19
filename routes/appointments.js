const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Ejecutar actualización automática de turnos
router.post('/auto-complete', AppointmentController.runAutoComplete);

// Obtener estadísticas de auto-completado
router.get('/auto-complete/stats', AppointmentController.getAutoCompleteStats);

// Verificar estado de auto-completado de un turno específico
router.get('/auto-complete/check/:id', AppointmentController.checkAutoCompleteStatus);

// Obtener turnos pendientes de auto-completado
router.get('/auto-complete/pending', AppointmentController.getPendingAutoComplete);

module.exports = router;
