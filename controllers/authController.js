const AuthService = require('../services/authService');
const path = require('path');

// Renderizar página de login
const renderLogin = (req, res) => {
    try {
        res.sendFile(path.join(__dirname, '..', 'views', 'login', 'index.html'));
    } catch (error) {
        console.error('Error renderizando login:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
};

// Renderizar página de registro
const renderRegister = (req, res) => {
    try {
        res.sendFile(path.join(__dirname, '..', 'views', 'register', 'index.html'));
    } catch (error) {
        console.error('Error renderizando registro:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
};

// Login de usuario
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await AuthService.login(email, password);

        // Establecer cookie con el token
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        });

        if (!res.headersSent) {
            res.json(result);
        }
    } catch (error) {
        console.error('Error en login:', error);
        if (!res.headersSent) {
            // Si el error es de credenciales inválidas, devolver 401
            if (error.message.includes('Credenciales inválidas')) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

// Registro de usuario
const register = async (req, res) => {
    try {
        // Los datos ya han sido validados por el middleware
        const result = await AuthService.register(req.body);

        // Establecer cookie con el token
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        });

        if (!res.headersSent) {
            res.json(result);
        }
    } catch (error) {
        console.error('Error en registro:', error);
        if (!res.headersSent) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

// Logout de usuario
const logout = (req, res) => {
    res.clearCookie('token');
    if (!res.headersSent) {
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    }
};

// Verificar token
const verifyToken = async (req, res) => {
    try {
        const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

        if (!token) {
            if (!res.headersSent) {
                return res.status(401).json({
                    success: false,
                    message: 'Token no proporcionado'
                });
            }
            return;
        }

        const result = await AuthService.verifyToken(token);
        if (!res.headersSent) {
            res.json(result);
        }
    } catch (error) {
        console.error('Error al verificar token:', error);
        
        // Limpiar cookie inválida
        if (req.cookies?.token) {
            res.clearCookie('token');
        }
        
        if (!res.headersSent) {
            res.status(401).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }
    }
};

// Obtener perfil de usuario
const getProfile = async (req, res) => {
    try {
        const result = await AuthService.getProfile(req.user.id);
        if (!res.headersSent) {
            res.json(result);
        }
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        if (!res.headersSent) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

// Actualizar perfil de usuario
const updateProfile = async (req, res) => {
    try {
        // Los datos ya han sido validados por el middleware
        const result = await AuthService.updateProfile(req.user.id, req.body);
        if (!res.headersSent) {
            res.json(result);
        }
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        if (!res.headersSent) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);
        if (!res.headersSent) {
            res.json(result);
        }
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        if (!res.headersSent) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

// Obtener configuración del barbero
const getBarberConfig = async (req, res) => {
    try {
        const result = await AuthService.getBarberConfig(req.user.id);
        if (!res.headersSent) {
            res.json(result);
        }
    } catch (error) {
        console.error('Error al obtener configuración del barbero:', error);
        if (!res.headersSent) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

// Actualizar configuración del barbero
const updateBarberConfig = async (req, res) => {
    try {
        const result = await AuthService.updateBarberConfig(req.user.id, req.body);
        if (!res.headersSent) {
            res.json(result);
        }
    } catch (error) {
        console.error('Error al actualizar configuración del barbero:', error);
        if (!res.headersSent) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = {
    renderLogin,
    renderRegister,
    login,
    register,
    logout,
    verifyToken,
    getProfile,
    updateProfile,
    changePassword,
    getBarberConfig,
    updateBarberConfig
}; 