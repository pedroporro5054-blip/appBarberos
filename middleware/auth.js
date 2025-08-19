const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
function authenticateToken(req, res, next) {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro', (err, user) => {
        if (err) {
            // Limpiar cookie si existe
            if (req.cookies?.token) {
                res.clearCookie('token');
            }
            return res.status(403).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }
        req.user = user;
        return next();
    });
}

// Middleware para verificar si el usuario está autenticado (para vistas)
function requireAuth(req, res, next) {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.redirect('/auth/login');
    }

    jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro', (err, user) => {
        if (err) {
            // Limpiar cookie inválida
            res.clearCookie('token');
            return res.redirect('/auth/login');
        }
        req.user = user;
        return next();
    });
}

// Middleware para verificar si el usuario NO está autenticado (para login/register)
function requireGuest(req, res, next) {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro', (err, user) => {
            if (!err) {
                return res.redirect('/dashboard');
            } else {
                // Limpiar cookie inválida
                if (req.cookies?.token) {
                    res.clearCookie('token');
                }
            }
            return next();
        });
    } else {
        return next();
    }
}

// Middleware para verificar rol específico
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (req.user.rol !== role && req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Rol insuficiente.'
            });
        }

        return next();
    };
}

// Middleware para verificar propiedad del recurso
function requireOwnership(req, res, next) {
    const resourceUserId = parseInt(req.params.userId || req.body.userId);
    
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado'
        });
    }

    if (req.user.rol === 'admin') {
        return next();
    }

    if (req.user.id !== resourceUserId) {
        return res.status(403).json({
            success: false,
            message: 'No tienes permisos para acceder a este recurso'
        });
    }

    return next();
}

// Middleware para logging de requests
function requestLogger(req, res, next) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    return next();
}

// Middleware para manejo de errores
function errorHandler(err, req, res, next) {
    console.error('Error en la aplicación:', err);
    
    // Verificar si ya se envió una respuesta
    if (res.headersSent) {
        return next(err);
    }
    
    if (req.path.startsWith('/api/')) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
    
    return res.status(500).send('Error interno del servidor');
}

// Middleware para validación de datos
function validateRequest(schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            if (!res.headersSent) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: error.details.map(detail => detail.message)
                });
            }
            return;
        }
        return next();
    };
}

module.exports = {
    authenticateToken,
    requireAuth,
    requireGuest,
    requireRole,
    requireOwnership,
    requestLogger,
    errorHandler,
    validateRequest
}; 