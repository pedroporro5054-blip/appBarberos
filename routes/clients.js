const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/clientController');
const { authenticateToken } = require('../middleware/auth');
const { 
    body, 
    param, 
    query 
} = require('express-validator');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Validaciones para crear/actualizar cliente
const clientValidation = [
    body('nombre')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    body('apellido')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('El email debe ser válido'),
    body('telefono')
        .trim()
        .isLength({ min: 8, max: 15 })
        .withMessage('El teléfono debe tener entre 8 y 15 caracteres'),
    body('fecha_nacimiento')
        .optional()
        .isISO8601()
        .withMessage('La fecha de nacimiento debe ser válida'),
    body('notas')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden exceder 500 caracteres')
];

// Validaciones para parámetros
const idValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de cliente inválido')
];

// Validaciones para búsqueda
const searchValidation = [
    query('q')
        .trim()
        .isLength({ min: 2 })
        .withMessage('El término de búsqueda debe tener al menos 2 caracteres')
];

// GET /api/clients - Obtener todos los clientes
router.get('/', ClientController.getClients);

// GET /api/clients/search - Buscar clientes
router.get('/search', searchValidation, ClientController.searchClients);

// GET /api/clients/stats - Obtener estadísticas de clientes
router.get('/stats', ClientController.getClientStats);

// GET /api/clients/frequent - Obtener clientes frecuentes
router.get('/frequent', ClientController.getFrequentClients);

// GET /api/clients/new - Obtener nuevos clientes
router.get('/new', ClientController.getNewClients);

// GET /api/clients/:id - Obtener un cliente específico
router.get('/:id', idValidation, ClientController.getClient);

// POST /api/clients - Crear un nuevo cliente
router.post('/', clientValidation, ClientController.createClient);

// PUT /api/clients/:id - Actualizar un cliente
router.put('/:id', [...idValidation, ...clientValidation], ClientController.updateClient);

// DELETE /api/clients/:id - Eliminar un cliente
router.delete('/:id', idValidation, ClientController.deleteClient);

module.exports = router; 