const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const BookingController = require('../controllers/bookingController');

// Rutas de vistas públicas
router.get('/booking', publicController.renderBooking);
router.get('/cancel', publicController.renderCancel);

// Rutas de API públicas (redirigidas a los nuevos controladores)
router.post('/api/booking', BookingController.createBooking);
router.post('/api/cancel', BookingController.cancelBooking);
router.get('/api/slots', BookingController.getAvailableSlots);
router.get('/api/services', BookingController.getServices);

module.exports = router; 