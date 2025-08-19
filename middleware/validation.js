const { body, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        if (!res.headersSent) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada inválidos',
                errors: errors.array().map(error => ({
                    field: error.path,
                    message: error.msg,
                    value: error.value
                }))
            });
        }
        return;
    }
    
    return next();
};

// Validaciones para registro de usuario
const validateRegister = [
    // Validación de código de registro
    body('registrationCode')
        .trim()
        .notEmpty()
        .withMessage('El código de registro es requerido')
        .custom((value) => {
            const validCodes = [
                process.env.REGISTRATION_CODE,
                process.env.ADMIN_REGISTRATION_CODE
            ];
            if (!validCodes.includes(value)) {
                throw new Error('Código de registro inválido');
            }
            return true;
        }),
    
    // Validación de nombre
    body('nombre')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios')
        .escape(),
    
    // Validación de apellido
    body('apellido')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El apellido solo puede contener letras y espacios')
        .escape(),
    
    // Validación de email
    body('email')
        .trim()
        .isEmail()
        .withMessage('Formato de email inválido')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('El email no puede exceder 100 caracteres'),
    
    // Validación de teléfono
    body('telefono')
        .trim()
        .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
        .withMessage('Formato de teléfono inválido. Debe tener entre 10 y 15 dígitos')
        .isLength({ min: 10, max: 15 })
        .withMessage('El teléfono debe tener entre 10 y 15 caracteres'),
    
    // Validación de nombre de barbería
    body('nombreBarberia')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre de la barbería debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.]+$/)
        .withMessage('El nombre de la barbería contiene caracteres no permitidos')
        .escape(),
    
    // Validación de dirección (opcional)
    body('direccion')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('La dirección no puede exceder 200 caracteres')
        .escape(),
    
    // Validación de descripción (opcional)
    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres')
        .escape(),
    
    // Validación de contraseña
    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('La contraseña debe tener entre 8 y 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
    
    // Validación de confirmación de contraseña
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Las contraseñas no coinciden');
            }
            return true;
        }),
    
    // Manejar errores de validación
    handleValidationErrors
];

// Validaciones para login
const validateLogin = [
    // Validación de email
    body('email')
        .trim()
        .isEmail()
        .withMessage('Formato de email inválido')
        .normalizeEmail(),
    
    // Validación de contraseña
    body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida'),
    
    // Manejar errores de validación
    handleValidationErrors
];

// Validaciones para actualización de perfil
const validateUpdateProfile = [
    // Validación de nombre (opcional en actualización)
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios')
        .escape(),
    
    // Validación de apellido (opcional en actualización)
    body('apellido')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El apellido solo puede contener letras y espacios')
        .escape(),
    
    // Validación de email (opcional en actualización)
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Formato de email inválido')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('El email no puede exceder 100 caracteres'),
    
    // Validación de teléfono (opcional en actualización)
    body('telefono')
        .optional()
        .trim()
        .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
        .withMessage('Formato de teléfono inválido. Debe tener entre 10 y 15 dígitos')
        .isLength({ min: 10, max: 15 })
        .withMessage('El teléfono debe tener entre 10 y 15 caracteres'),
    
    // Validación de nombre de barbería (opcional en actualización)
    body('nombreBarberia')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre de la barbería debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.]+$/)
        .withMessage('El nombre de la barbería contiene caracteres no permitidos')
        .escape(),
    
    // Validación de dirección (opcional en actualización)
    body('direccion')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('La dirección no puede exceder 200 caracteres')
        .escape(),
    
    // Validación de descripción (opcional en actualización)
    body('descripcion')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres')
        .escape(),
    
    // Manejar errores de validación
    handleValidationErrors
];

// Validaciones para cambio de contraseña
const validateChangePassword = [
    // Validación de contraseña actual
    body('currentPassword')
        .notEmpty()
        .withMessage('La contraseña actual es requerida'),
    
    // Validación de nueva contraseña
    body('newPassword')
        .isLength({ min: 8, max: 128 })
        .withMessage('La nueva contraseña debe tener entre 8 y 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número'),
    
    // Validación de confirmación de nueva contraseña
    body('confirmNewPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Las contraseñas no coinciden');
            }
            return true;
        }),
    
    // Manejar errores de validación
    handleValidationErrors
];

// Función para sanitizar datos de entrada
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .trim()
        .replace(/[<>]/g, '') // Remover caracteres peligrosos
        .replace(/\s+/g, ' '); // Normalizar espacios
};

// Middleware para sanitizar todos los campos de texto
const sanitizeTextFields = (req, res, next) => {
    Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
            req.body[key] = sanitizeInput(req.body[key]);
        }
    });
    return next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateUpdateProfile,
    validateChangePassword,
    handleValidationErrors,
    sanitizeTextFields
}; 