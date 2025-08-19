const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeTextFields } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para horarios laborales
router.get('/working-hours', scheduleController.getWorkingHours);
router.post('/working-hours', sanitizeTextFields, scheduleController.saveWorkingHour);
router.put('/working-hours/:id', sanitizeTextFields, scheduleController.saveWorkingHour);
router.delete('/working-hours/:id', scheduleController.deleteWorkingHour);

// Rutas para días especiales
router.get('/special-days', scheduleController.getSpecialDays);
router.post('/special-days', sanitizeTextFields, scheduleController.createSpecialDay);
router.put('/special-days/:id', sanitizeTextFields, scheduleController.updateSpecialDay);
router.delete('/special-days/:id', scheduleController.deleteSpecialDay);

// Rutas para configuración de horarios
router.get('/config', scheduleController.getScheduleConfig);
router.put('/config', sanitizeTextFields, scheduleController.updateScheduleConfig);

module.exports = router; 