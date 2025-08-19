const path = require('path');

// Controlador para vistas públicas del usuario

// Renderizar formulario de agendamiento
async function renderBooking(req, res) {
    try {
        res.sendFile(path.join(__dirname, '..', 'views', 'booking', 'index.html'));
    } catch (error) {
        console.error('Error renderizando formulario de agendamiento:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
}

// Renderizar formulario de cancelación
async function renderCancel(req, res) {
    try {
        res.sendFile(path.join(__dirname, '..', 'views', 'cancel', 'index.html'));
    } catch (error) {
        console.error('Error renderizando formulario de cancelación:', error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
}

// Procesar agendamiento de turno
async function processBooking(req, res) {
    try {
        const {
            nombre,
            apellido,
            email,
            telefono,
            servicio,
            fecha,
            hora,
            comentarios
        } = req.body;

        // Validar campos requeridos
        if (!nombre || !apellido || !email || !telefono || !servicio || !fecha || !hora) {
            if (!res.headersSent) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos obligatorios deben ser completados'
                });
            }
            return;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            if (!res.headersSent) {
                return res.status(400).json({
                    success: false,
                    message: 'El formato del email no es válido'
                });
            }
            return;
        }

        // Validar fecha (no puede ser en el pasado)
        const selectedDate = new Date(fecha);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            if (!res.headersSent) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha seleccionada no puede ser en el pasado'
                });
            }
            return;
        }

        // Aquí iría la lógica para guardar en la base de datos
        // Por ahora, simulamos el proceso
        
        // Generar código de confirmación único
        const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Simular guardado en base de datos
        console.log('Nueva reserva:', {
            nombre,
            apellido,
            email,
            telefono,
            servicio,
            fecha,
            hora,
            comentarios,
            confirmationCode
        });

        // Aquí se enviaría el email de confirmación
        // await sendConfirmationEmail(email, confirmationCode, { nombre, apellido, servicio, fecha, hora });

        if (!res.headersSent) {
            res.status(201).json({
                success: true,
                message: 'Reserva confirmada exitosamente',
                data: {
                    confirmationCode,
                    appointment: {
                        nombre,
                        apellido,
                        servicio,
                        fecha,
                        hora
                    }
                }
            });
        }

    } catch (error) {
        console.error('Error procesando agendamiento:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

// Procesar cancelación de turno
async function processCancel(req, res) {
    try {
        const { confirmationCode, email } = req.body;

        // Validar campos requeridos
        if (!confirmationCode || !email) {
            if (!res.headersSent) {
                return res.status(400).json({
                    success: false,
                    message: 'Código de confirmación y email son requeridos'
                });
            }
            return;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            if (!res.headersSent) {
                return res.status(400).json({
                    success: false,
                    message: 'El formato del email no es válido'
                });
            }
            return;
        }

        // Aquí iría la lógica para buscar y cancelar en la base de datos
        // Por ahora, simulamos el proceso
        
        console.log('Cancelación solicitada:', {
            confirmationCode,
            email
        });

        // Simular búsqueda y cancelación
        // const appointment = await findAppointmentByCode(confirmationCode, email);
        // if (!appointment) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'No se encontró una reserva con esos datos'
        //     });
        // }

        if (!res.headersSent) {
            res.json({
                success: true,
                message: 'Reserva cancelada exitosamente'
            });
        }

    } catch (error) {
        console.error('Error procesando cancelación:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

// Obtener horarios disponibles
async function getAvailableSlots(req, res) {
    try {
        const { fecha, servicio_id, barbero_id } = req.query;

        if (!fecha) {
            if (!res.headersSent) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha es requerida'
                });
            }
            return;
        }

        // Importar el BookingController para usar su lógica inteligente
        const BookingController = require('./bookingController');
        
        // Usar la misma lógica que el BookingController
        const result = await BookingController.getAvailableSlots({
            query: { fecha, servicio_id, barbero_id },
            user: { id: barbero_id || 1 } // Usar barbero por defecto si no se especifica
        }, res);

        // Si no se envió respuesta, enviar una por defecto
        if (!res.headersSent) {
            res.json(result || {
                success: true,
                data: [],
                message: 'No hay horarios disponibles para esta fecha'
            });
        }

    } catch (error) {
        console.error('Error obteniendo horarios disponibles:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

// Obtener servicios disponibles
async function getAvailableServices(req, res) {
    try {
        const { query } = require('../config/db');
        const UserService = require('../services/userService');
        
        // Obtener el ID del barbero principal dinámicamente
        const mainUserId = await UserService.getMainUserId();
        
        // Obtener servicios del barbero principal
        const services = await query(`
            SELECT 
                s.id,
                s.nombre,
                s.descripcion,
                s.precio,
                s.estado
            FROM servicios s
            INNER JOIN usuarios u ON s.id_usuario = u.id
            WHERE s.estado = 'activo' AND u.estado = 'activo' AND u.id = ?
            ORDER BY s.nombre ASC
        `, [mainUserId]);

        // Formatear los servicios para el frontend (sin información del barbero)
        const formattedServices = services.map(service => ({
            id: service.id,
            nombre: service.nombre,
            descripcion: service.descripcion || '',
            precio: parseFloat(service.precio),
            duracion: 'Configurado'
        }));

        if (!res.headersSent) {
            res.json({
                success: true,
                data: formattedServices
            });
        }

    } catch (error) {
        console.error('Error obteniendo servicios:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = {
    renderBooking,
    renderCancel,
    processBooking,
    processCancel,
    getAvailableSlots,
    getAvailableServices
}; 