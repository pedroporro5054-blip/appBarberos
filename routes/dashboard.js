const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

// Todas las rutas del dashboard requieren autenticación
router.use(requireAuth);

// Rutas del dashboard
router.get('/', dashboardController.renderDashboard);
router.get('/stats', dashboardController.getDashboardStats);
router.get('/config', dashboardController.getBarberConfig);
router.put('/config', dashboardController.updateBarberConfig);

// Rutas de turnos
router.get('/appointments', dashboardController.getAllAppointments);
router.get('/appointments/:id', dashboardController.getAppointmentDetails);
router.post('/appointments', dashboardController.createAppointment);
router.put('/appointments/:id', dashboardController.updateAppointmentStatus);
router.put('/appointments/:id/confirm', dashboardController.confirmAppointment);
router.put('/appointments/:id/cancel', dashboardController.cancelAppointment);
router.put('/appointments/:id/complete', dashboardController.completeAppointment);
router.delete('/appointments/:id', dashboardController.deleteAppointment);

// Rutas de clientes
router.get('/clients', dashboardController.getAllClients);
router.get('/clients/:id', dashboardController.getClientDetails);
router.put('/clients/:id', dashboardController.updateClient);
router.delete('/clients/:id', dashboardController.deleteClient);

// Rutas de servicios
router.get('/services', dashboardController.getAllServices);
router.get('/services/:id', dashboardController.getServiceDetails);
router.post('/services', dashboardController.createService);
router.put('/services/:id', dashboardController.updateService);
router.delete('/services/:id', dashboardController.deleteService);

module.exports = router; 