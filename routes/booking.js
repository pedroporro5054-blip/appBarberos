const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/bookingController');

// ===== RUTAS PÚBLICAS (sin autenticación) =====

/**
 * @route POST /api/booking
 * @desc Crear una nueva reserva/cita
 * @access Public
 */
router.post('/', BookingController.createBooking);

/**
 * @route GET /api/booking/services
 * @desc Obtener servicios disponibles
 * @access Public
 */
router.get('/services', BookingController.getServices);

/**
 * @route GET /api/booking/slots
 * @desc Obtener horarios disponibles para una fecha
 * @access Public
 */
router.get('/slots', BookingController.getAvailableSlots);

/**
 * @route POST /api/booking/cancel
 * @desc Cancelar una reserva por código de cancelación
 * @access Public
 */
router.post('/cancel', BookingController.cancelBooking);

/**
 * @route GET /api/booking/:codigo
 * @desc Obtener información de una reserva por código
 * @access Public
 */
router.get('/:codigo', BookingController.getBookingByCode);

module.exports = router; 