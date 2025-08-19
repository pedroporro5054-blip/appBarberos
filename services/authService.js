const User = require('../models/User');
const { generateToken, hashPassword, comparePassword, isValidEmail } = require('../utils/auth');
const jwt = require('jsonwebtoken');

class AuthService {
    // Registrar un nuevo usuario
    static async register(userData) {
        try {
            // Validar datos de entrada
            const { 
                email, 
                password, 
                nombre, 
                apellido, 
                telefono,
                nombreBarberia,
                direccion,
                descripcion,
                registrationCode
            } = userData;
            
            if (!email || !password || !nombre || !apellido || !nombreBarberia || !registrationCode) {
                throw new Error('Todos los campos obligatorios deben estar completos');
            }

            if (!isValidEmail(email)) {
                throw new Error('Formato de email inválido');
            }

            if (password.length < 8) {
                throw new Error('La contraseña debe tener al menos 8 caracteres');
            }

            // Verificar si el email ya existe
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                throw new Error('El email ya está registrado');
            }

            // Hashear la contraseña
            const hashedPassword = await hashPassword(password);

            // Determinar el rol basado en el código de registro
            let userRole = 'barbero';
            if (registrationCode === process.env.ADMIN_REGISTRATION_CODE) {
                userRole = 'admin';
            } else if (registrationCode !== process.env.REGISTRATION_CODE) {
                throw new Error('Código de registro inválido');
            }

            // Preparar datos del usuario
            const userToCreate = {
                ...userData,
                password: hashedPassword,
                rol: userRole
            };

            // Crear el usuario
            const newUser = await User.create(userToCreate);

            // Generar token
            const token = generateToken(newUser);

            return {
                success: true,
                message: 'Usuario registrado exitosamente',
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    nombre: newUser.nombre,
                    apellido: newUser.apellido,
                    nombreBarberia: newUser.nombreBarberia,
                    direccion: newUser.direccion,
                    descripcion: newUser.descripcion,
                    rol: newUser.rol
                },
                token
            };
        } catch (error) {
            throw new Error(`Error en el registro: ${error.message}`);
        }
    }

    // Iniciar sesión
    static async login(email, password) {
        try {
            // Validar datos de entrada
            if (!email || !password) {
                throw new Error('Email y contraseña son requeridos');
            }

            if (!isValidEmail(email)) {
                throw new Error('Formato de email inválido');
            }

            // Buscar usuario por email
            const user = await User.findByEmail(email);
            if (!user) {
                throw new Error('Credenciales inválidas');
            }

            // Verificar contraseña
            const isPasswordValid = await comparePassword(password, user.password);
            if (!isPasswordValid) {
                throw new Error('Credenciales inválidas');
            }

            // Verificar si el usuario está activo
            if (user.estado !== 'activo') {
                throw new Error('Tu cuenta está inactiva. Contacta al administrador.');
            }

            // Generar token
            const token = generateToken(user);

            return {
                success: true,
                message: 'Inicio de sesión exitoso',
                user: {
                    id: user.id,
                    email: user.email,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    nombreBarberia: user.nombre_barberia,
                    direccion: user.direccion,
                    descripcion: user.descripcion,
                    rol: user.rol
                },
                token
            };
        } catch (error) {
            throw new Error(`Error en el login: ${error.message}`);
        }
    }

    // Verificar token
    static async verifyToken(token) {
        try {
            if (!token) {
                throw new Error('Token no proporcionado');
            }

            // Verificar el token JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro');
            
            // Verificar que el token tenga un ID válido
            if (!decoded.id) {
                throw new Error('Token inválido: ID de usuario no encontrado');
            }

            // Buscar usuario por ID del token
            const user = await User.findById(decoded.id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar si el usuario está activo
            if (user.estado !== 'activo') {
                throw new Error('Usuario inactivo');
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    nombreBarberia: user.nombre_barberia,
                    direccion: user.direccion,
                    descripcion: user.descripcion,
                    rol: user.rol
                }
            };
        } catch (error) {
            throw new Error(`Error al verificar token: ${error.message}`);
        }
    }

    // Obtener perfil de usuario
    static async getProfile(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Obtener configuración del barbero si existe
            let barberConfig = null;
            if (user.rol === 'barbero') {
                barberConfig = await User.getBarberConfig(userId);
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    telefono: user.telefono,
                    nombreBarberia: user.nombre_barberia,
                    direccion: user.direccion,
                    descripcion: user.descripcion,
                    avatar_url: user.avatar_url,
                    rol: user.rol,
                    estado: user.estado,
                    creado_en: user.creado_en
                },
                barberConfig
            };
        } catch (error) {
            throw new Error(`Error al obtener perfil: ${error.message}`);
        }
    }

    // Actualizar perfil de usuario
    static async updateProfile(userId, updateData) {
        try {
            // Validar que el usuario existe
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Validar email si se está actualizando
            if (updateData.email && !isValidEmail(updateData.email)) {
                throw new Error('Formato de email inválido');
            }

            // Verificar si el email ya existe (excluyendo el usuario actual)
            if (updateData.email) {
                const emailExists = await User.emailExists(updateData.email, userId);
                if (emailExists) {
                    throw new Error('El email ya está en uso por otro usuario');
                }
            }

            // Actualizar usuario
            const success = await User.update(userId, updateData);
            if (!success) {
                throw new Error('Error al actualizar el perfil');
            }

            // Obtener usuario actualizado
            const updatedUser = await User.findById(userId);

            return {
                success: true,
                message: 'Perfil actualizado exitosamente',
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    nombre: updatedUser.nombre,
                    apellido: updatedUser.apellido,
                    telefono: updatedUser.telefono,
                    nombreBarberia: updatedUser.nombre_barberia,
                    direccion: updatedUser.direccion,
                    descripcion: updatedUser.descripcion,
                    avatar_url: updatedUser.avatar_url,
                    rol: updatedUser.rol
                }
            };
        } catch (error) {
            throw new Error(`Error al actualizar perfil: ${error.message}`);
        }
    }

    // Cambiar contraseña
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            // Validar datos de entrada
            if (!currentPassword || !newPassword) {
                throw new Error('Contraseña actual y nueva contraseña son requeridas');
            }

            if (newPassword.length < 8) {
                throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
            }

            // Buscar usuario
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar contraseña actual
            const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new Error('Contraseña actual incorrecta');
            }

            // Hashear nueva contraseña
            const hashedNewPassword = await hashPassword(newPassword);

            // Actualizar contraseña
            const success = await User.updatePassword(userId, hashedNewPassword);
            if (!success) {
                throw new Error('Error al actualizar la contraseña');
            }

            return {
                success: true,
                message: 'Contraseña actualizada exitosamente'
            };
        } catch (error) {
            throw new Error(`Error al cambiar contraseña: ${error.message}`);
        }
    }

    // Actualizar configuración del barbero
    static async updateBarberConfig(userId, configData) {
        try {
            // Validar que el usuario existe y es barbero
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            if (user.rol !== 'barbero') {
                throw new Error('Solo los barberos pueden actualizar su configuración');
            }

            // Actualizar configuración
            const success = await User.updateBarberConfig(userId, configData);
            if (!success) {
                throw new Error('Error al actualizar la configuración');
            }

            // Obtener configuración actualizada
            const updatedConfig = await User.getBarberConfig(userId);

            return {
                success: true,
                message: 'Configuración actualizada exitosamente',
                config: updatedConfig
            };
        } catch (error) {
            throw new Error(`Error al actualizar configuración: ${error.message}`);
        }
    }

    // Obtener configuración del barbero
    static async getBarberConfig(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            if (user.rol !== 'barbero') {
                throw new Error('Solo los barberos pueden acceder a su configuración');
            }

            const config = await User.getBarberConfig(userId);
            if (!config) {
                throw new Error('Configuración no encontrada');
            }

            return {
                success: true,
                config
            };
        } catch (error) {
            throw new Error(`Error al obtener configuración: ${error.message}`);
        }
    }
}

module.exports = AuthService; 