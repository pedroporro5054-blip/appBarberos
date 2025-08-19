const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, requireGuest } = require('../middleware/auth');
const { 
    validateRegister, 
    validateLogin, 
    validateUpdateProfile, 
    validateChangePassword,
    sanitizeTextFields 
} = require('../middleware/validation');

// Rutas públicas (solo para usuarios NO autenticados)
router.get('/login', requireGuest, authController.renderLogin);
router.get('/register', requireGuest, authController.renderRegister);

// Rutas de autenticación (API) con validación
router.post('/login', sanitizeTextFields, validateLogin, authController.login);
router.post('/register', sanitizeTextFields, validateRegister, authController.register);
router.post('/logout', authController.logout);
router.get('/verify', authController.verifyToken);

// Rutas protegidas (solo para usuarios autenticados) con validación
router.get('/profile', requireAuth, authController.getProfile);
router.put('/profile', requireAuth, sanitizeTextFields, validateUpdateProfile, authController.updateProfile);
router.put('/change-password', requireAuth, sanitizeTextFields, validateChangePassword, authController.changePassword);

// Rutas de configuración del barbero
router.get('/barber-config', requireAuth, authController.getBarberConfig);
router.put('/barber-config', requireAuth, sanitizeTextFields, authController.updateBarberConfig);

module.exports = router; 