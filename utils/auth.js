const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Middleware para verificar token JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }
        req.user = user;
        next();
    });
}

// Middleware para verificar si el usuario está autenticado (para vistas)
function requireAuth(req, res, next) {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro', (err, user) => {
        if (err) {
            res.clearCookie('token');
            return res.redirect('/login');
        }
        req.user = user;
        next();
    });
}

// Middleware para verificar si el usuario NO está autenticado (para login/register)
function requireGuest(req, res, next) {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro', (err, user) => {
            if (!err) {
                return res.redirect('/dashboard');
            }
        });
    }
    next();
}

// Función para generar token JWT
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            rol: user.rol
        },
        process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
}

// Función para hashear contraseñas
async function hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

// Función para comparar contraseñas
async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
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

        next();
    };
}

// Función para verificar si el usuario puede acceder a un recurso específico
function canAccessResource(userId, resourceUserId) {
    return userId === resourceUserId;
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

    if (!canAccessResource(req.user.id, resourceUserId)) {
        return res.status(403).json({
            success: false,
            message: 'No tienes permisos para acceder a este recurso'
        });
    }

    next();
}

// Función para generar contraseña aleatoria
function generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Función para validar formato de email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para validar formato de teléfono
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Función para sanitizar datos de entrada
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
}

// Función para formatear fecha
function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day);
}

// Función para formatear hora
function formatTime(date, format = 'HH:mm') {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return format
        .replace('HH', hours)
        .replace('mm', minutes);
}

// Función para calcular diferencia entre fechas en minutos
function getTimeDifferenceInMinutes(date1, date2) {
    const diff = Math.abs(new Date(date1) - new Date(date2));
    return Math.floor(diff / (1000 * 60));
}

// Función para verificar si una fecha es válida
function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

// Función para obtener el día de la semana
function getDayOfWeek(date) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date(date).getDay()];
}

module.exports = {
    authenticateToken,
    requireAuth,
    requireGuest,
    generateToken,
    hashPassword,
    comparePassword,
    requireRole,
    canAccessResource,
    requireOwnership,
    generateRandomPassword,
    isValidEmail,
    isValidPhone,
    sanitizeInput,
    formatDate,
    formatTime,
    getTimeDifferenceInMinutes,
    isValidDate,
    getDayOfWeek
}; 