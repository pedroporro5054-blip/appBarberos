const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const { query } = require('../config/db');
const UserService = require('../services/userService');

class BookingController {
    /**
     * Crear una nueva reserva/cita
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async createBooking(req, res) {
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

            // Validar datos requeridos
            if (!nombre || !apellido || !telefono || !servicio || !fecha || !hora) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos obligatorios deben estar completos'
                });
            }

            // Validar formato de email si se proporciona
            if (email && !BookingController.isValidEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'El formato del email no es válido'
                });
            }

    
            
            
    
            const [year, month, day] = fecha.split('-').map(Number);
            const selectedDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            
            
            if (selectedDate < today) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pueden hacer reservas para fechas pasadas'
                });
            }

            const serviceInfo = await BookingController.getServiceInfoById(servicio);
    
            
            if (!serviceInfo) {
                return res.status(400).json({
                    success: false,
                    message: 'El servicio seleccionado no está disponible'
                });
            }

            const id_usuario = serviceInfo.id_usuario;
    

            const config = await BookingController.getBarberConfig(id_usuario);
            const serviceDuration = config.intervalo_turnos || 30;
            
            const horaInicio = new Date(`2000-01-01T${hora}`);
            const horaFin = new Date(horaInicio.getTime() + (serviceDuration * 60000));
            const horaFinStr = horaFin.toTimeString().slice(0, 5);
            
            

            const isAvailable = await Appointment.checkAvailability(
                id_usuario, 
                fecha, 
                hora, 
                horaFinStr
            );

            if (!isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: 'El horario seleccionado no está disponible'
                });
            }

            const clientData = {
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                email: email ? email.trim() : null,
                telefono: telefono.trim(),
                notas: comentarios ? comentarios.trim() : null
            };

            const client = await Client.findOrCreateByPhone(clientData);

            const codigo_cancelacion = await Appointment.generateCancelCode();
            
            const appointmentData = {
                fecha,
                hora_inicio: hora,
                hora_fin: horaFinStr,
                id_cliente: client.id,
                id_usuario,
                id_servicio: serviceInfo.id,
                precio_final: serviceInfo.precio,
                codigo_cancelacion,
                notas: comentarios ? comentarios.trim() : null
            };

            const appointment = await Appointment.create(appointmentData);

            await Client.incrementVisits(client.id);

            res.status(201).json({
                success: true,
                message: 'Reserva creada exitosamente',
                data: {
                    appointment_id: appointment.id,
                    confirmationCode: codigo_cancelacion,
                    client: {
                        nombre: client.nombre,
                        apellido: client.apellido,
                        email: client.email,
                        telefono: client.telefono
                    },
                    service: {
                        nombre: serviceInfo.nombre,
                        precio: serviceInfo.precio
                    },
                    appointment: {
                        fecha,
                        hora_inicio: hora,
                        hora_fin: horaFinStr
                    }
                }
            });

        } catch (error) {
            console.error('Error al crear reserva:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al procesar la reserva'
            });
        }
    }

    /**
     * Obtener todos los barberos disponibles
     * @returns {Promise<Array>} - Lista de barberos disponibles
     */
    static async getAvailableBarbers() {
        try {
            const sql = `
                SELECT 
                    u.id,
                    u.nombre,
                    u.apellido,
                    u.nombre_barberia,
                    u.avatar_url,
                    u.descripcion,
                    u.rol,
                    COALESCE(COUNT(DISTINCT s.id), 0) as servicios_count,
                    COALESCE(COUNT(DISTINCT h.id), 0) as horarios_count
                FROM usuarios u
                LEFT JOIN servicios s ON u.id = s.id_usuario AND s.estado = 'activo'
                LEFT JOIN horarios_laborales h ON u.id = h.id_usuario AND h.estado = 'activo'
                WHERE (u.rol = 'barbero' OR u.rol = 'admin') 
                AND u.estado = 'activo'
                GROUP BY u.id, u.nombre, u.apellido, u.nombre_barberia, u.avatar_url, u.descripcion, u.rol
                HAVING servicios_count > 0 AND horarios_count > 0
                ORDER BY u.rol DESC, u.nombre, u.apellido
            `;

            const barberos = await query(sql);
            return barberos;
        } catch (error) {
            console.error('Error al obtener barberos disponibles:', error);
            return [];
        }
    }

    /**
     * Obtener servicios disponibles con información de barberos
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async getServices(req, res) {
        try {
            const barberos = await BookingController.getAvailableBarbers();
            
            if (barberos.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No hay barberos disponibles en este momento'
                });
            }

            const servicios = [];
            for (const barbero of barberos) {
                const sql = `
                    SELECT 
                        s.id,
                        s.nombre,
                        s.descripcion,
                        s.precio,
                        s.precio_anterior,
                        s.id_usuario,
                        CONCAT(u.nombre, ' ', u.apellido) as barbero_nombre,
                        u.nombre_barberia,
                        u.avatar_url
                    FROM servicios s
                    JOIN usuarios u ON s.id_usuario = u.id
                    WHERE s.id_usuario = ? AND s.estado = 'activo'
                    ORDER BY s.nombre
                `;
                
                const barberoServicios = await query(sql, [barbero.id]);
                servicios.push(...barberoServicios);
            }

            const serviciosPorBarbero = {};
            barberos.forEach(barbero => {
                serviciosPorBarbero[barbero.id] = {
                    barbero: {
                        id: barbero.id,
                        nombre: barbero.nombre,
                        apellido: barbero.apellido,
                        nombre_completo: `${barbero.nombre} ${barbero.apellido}`,
                        nombre_barberia: barbero.nombre_barberia,
                        avatar_url: barbero.avatar_url,
                        descripcion: barbero.descripcion,
                        servicios_count: barbero.servicios_count,
                        horarios_count: barbero.horarios_count
                    },
                    servicios: servicios.filter(s => s.id_usuario === barbero.id)
                };
            });

            return res.json({
                success: true,
                message: 'Servicios cargados correctamente',
                data: servicios,
                barberos: barberos,
                serviciosPorBarbero: serviciosPorBarbero,
                total_servicios: servicios.length,
                total_barberos: barberos.length
            });

        } catch (error) {
            console.error('Error al obtener servicios:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor al cargar servicios'
            });
        }
    }

    /**
     * Obtener horarios disponibles para una fecha
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async getAvailableSlots(req, res) {
        try {
            const { fecha, servicio_id, exclude_id, barbero_id } = req.query;

            if (!fecha) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha es requerida'
                });
            }

        let barbero;
        if (barbero_id) {
                const sql = `
                    SELECT 
                        u.id,
                        u.nombre,
                        u.apellido,
                        u.nombre_barberia,
                        u.rol,
                        u.estado
                    FROM usuarios u
                    WHERE u.id = ? AND (u.rol = 'barbero' OR u.rol = 'admin') AND u.estado = 'activo'
                `;
                const [barberoResult] = await query(sql, [barbero_id]);
                barbero = barberoResult;
            }

            if (!barbero) {
                barbero = await BookingController.getMainBarber();
                if (!barbero) {
                    return res.status(404).json({
                        success: false,
                        message: 'No hay barberos o administradores disponibles en este momento'
                    });
                }
            }

            const id_usuario = barbero.id;
    

            const specialDay = await BookingController.checkSpecialDay(id_usuario, fecha);
            if (specialDay) {
                return res.json({
                    success: true,
                    data: [],
                    message: `No hay horarios disponibles: ${specialDay.descripcion || specialDay.tipo}`,
                    barbero: {
                        id: barbero.id,
                        nombre: `${barbero.nombre} ${barbero.apellido}`,
                        barberia: barbero.nombre_barberia || 'Barbería',
                        rol: barbero.rol || 'barbero'
                    }
                });
            }

            const config = await BookingController.getBarberConfig(id_usuario);
            
            // Obtener la duración real del servicio desde la base de datos
            let serviceDuration = 30; // Duración por defecto
            if (servicio_id) {
                try {
                    const servicio = await query(`
                        SELECT duracion FROM servicios WHERE id = ? AND estado = 'activo'
                    `, [servicio_id]);
                    
                    if (servicio.length > 0) {
                        serviceDuration = servicio[0].duracion;
                        console.log(`✅ Duración del servicio ${servicio_id}: ${serviceDuration} minutos`);
                    } else {
                        console.warn(`⚠️  Servicio ${servicio_id} no encontrado, usando duración por defecto: 30 min`);
                    }
                } catch (error) {
                    console.error('Error al obtener duración del servicio:', error);
                    serviceDuration = 30; // Usar duración por defecto en caso de error
                }
            }
            
            // El intervalo ya no se usa para la duración del servicio, solo para el buffer
            let interval = config.intervalo_turnos || 5; // Buffer entre turnos
            

    

            const dayOfWeek = BookingController.getDayOfWeek(fecha);
            const workingHours = await BookingController.getWorkingHours(id_usuario, dayOfWeek);

            if (!workingHours || workingHours.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                    message: `No hay horarios laborales configurados para ${barbero.nombre} en este día de la semana`,
                    barbero: {
                        id: barbero.id,
                        nombre: `${barbero.nombre} ${barbero.apellido}`,
                        barberia: barbero.nombre_barberia || 'Barbería',
                        rol: barbero.rol || 'barbero'
                    }
                });
            }

            let existingAppointments = await Appointment.getTodayAppointments(id_usuario, fecha);
            
            if (exclude_id) {
                existingAppointments = existingAppointments.filter(app => app.id != exclude_id);
            }

            // Usar la nueva función inteligente de generación de slots
            const availableSlots = BookingController.generateSmartSlots(
                workingHours,
                existingAppointments,
                serviceDuration,
                { ...config, bufferTime: interval } // Pasar el bufferTime configurado
            );

    

            res.json({
                success: true,
                data: availableSlots,
                barbero: {
                    id: barbero.id,
                    nombre: `${barbero.nombre} ${barbero.apellido}`,
                    barberia: barbero.nombre_barberia || 'Barbería',
                    rol: barbero.rol || 'barbero'
                }
            });

        } catch (error) {
            console.error('Error al obtener horarios disponibles:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los horarios disponibles'
            });
        }
    }

    /**
     * Cancelar una reserva por código
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async cancelBooking(req, res) {
        try {
            const { codigo_cancelacion } = req.body;

            if (!codigo_cancelacion) {
                return res.status(400).json({
                    success: false,
                    message: 'El código de cancelación es requerido'
                });
            }

            const appointment = await Appointment.cancelByCode(codigo_cancelacion);

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró una reserva válida con ese código'
                });
            }

            res.json({
                success: true,
                message: 'Reserva cancelada exitosamente',
                data: {
                    appointment_id: appointment.id,
                    cliente: `${appointment.cliente_nombre} ${appointment.cliente_apellido}`,
                    servicio: appointment.servicio_nombre,
                    fecha: appointment.fecha,
                    hora: appointment.hora_inicio
                }
            });

        } catch (error) {
            console.error('Error al cancelar reserva:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cancelar la reserva'
            });
        }
    }

    /**
     * Obtener información de una reserva por código
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async getBookingByCode(req, res) {
        try {
            const { codigo } = req.params;

            if (!codigo) {
                return res.status(400).json({
                    success: false,
                    message: 'El código de reserva es requerido'
                });
            }

            const appointment = await Appointment.findByCancelCode(codigo);

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró una reserva con ese código'
                });
            }

            res.json({
                success: true,
                data: {
                    appointment_id: appointment.id,
                    cliente: `${appointment.cliente_nombre} ${appointment.cliente_apellido}`,
                    email: appointment.cliente_email,
                    telefono: appointment.cliente_telefono,
                    servicio: appointment.servicio_nombre,
                    fecha: appointment.fecha,
                    hora_inicio: appointment.hora_inicio,
                    hora_fin: appointment.hora_fin,
                    estado: appointment.estado,
                    precio_final: appointment.precio_final,
                    notas: appointment.notas
                }
            });

        } catch (error) {
            console.error('Error al obtener reserva por código:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener la información de la reserva'
            });
        }
    }

    // ===== MÉTODOS AUXILIARES =====

    /**
     * Validar formato de email
     * @param {string} email - Email a validar
     * @returns {boolean} - true si es válido
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Obtener información de un servicio
     * @param {string} serviceKey - Clave del servicio
     * @param {number} id_usuario - ID del usuario/barbero
     * @returns {Promise<Object|null>} - Información del servicio
     */
    static async getServiceInfo(serviceKey, id_usuario) {
        try {
            // Mapeo de servicios hardcodeados a IDs de base de datos
            const serviceMapping = {
                'corte-clasico': 1,
                'barba': 2,
                'corte-barba': 3,
                'coloracion': 4,
                'tratamiento': 5,
                'premium': 6
            };

            const serviceId = serviceMapping[serviceKey];
            if (!serviceId) return null;

            const sql = 'SELECT * FROM servicios WHERE id = ? AND id_usuario = ? AND estado = "activo"';
            const [service] = await query(sql, [serviceId, id_usuario]);
            
            return service || null;
        } catch (error) {
            console.error('Error al obtener información del servicio:', error);
            return null;
        }
    }

    /**
     * Obtener información de un servicio por ID
     * @param {number} serviceId - ID del servicio
     * @param {number} id_usuario - ID del usuario/barbero
     * @returns {Promise<Object|null>} - Información del servicio
     */
    static async getServiceInfoById(serviceId) {
        try {
    
            
            const sql = 'SELECT * FROM servicios WHERE id = ? AND estado = "activo"';
            const [service] = await query(sql, [serviceId]);
            
    
            
            return service || null;
        } catch (error) {
            console.error('Error al obtener información del servicio por ID:', error);
            return null;
        }
    }

    /**
     * Obtener día de la semana en español
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     * @returns {string} - Día de la semana en español
     */
    static getDayOfWeek(fecha) {
        const [year, month, day] = fecha.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        return days[date.getUTCDay()];
    }

    /**
     * Obtener horarios laborales para un día
     * @param {number} id_usuario - ID del usuario/barbero
     * @param {string} dia_semana - Día de la semana
     * @returns {Promise<Array>} - Horarios laborales
     */
    static async getWorkingHours(id_usuario, dia_semana) {
        try {
            const sql = `
                SELECT hora_inicio, hora_fin, pausa_inicio, pausa_fin
                FROM horarios_laborales
                WHERE id_usuario = ? AND dia_semana = ? AND estado = 'activo'
            `;

            const hours = await query(sql, [id_usuario, dia_semana]);
            return hours;
        } catch (error) {
            console.error('Error al obtener horarios laborales:', error);
            return [];
        }
    }

    /**
     * DEPRECATED: Esta función ha sido reemplazada por generateSmartSlots
     * Use generateSmartSlots en su lugar para obtener slots basados en la duración real del servicio
     * 
     * @deprecated Use generateSmartSlots instead
     */
    static generateAvailableSlots(workingHours, existingAppointments, serviceDuration, config) {
        console.warn('⚠️  generateAvailableSlots está deprecada. Use generateSmartSlots en su lugar.');
        return this.generateSmartSlots(workingHours, existingAppointments, serviceDuration, config);
    }

    /**
     * Generar slots disponibles de manera inteligente y eficiente
     * @param {Array} workingHours - Horarios laborales
     * @param {Array} existingAppointments - Citas existentes
     * @param {number} serviceDuration - Duración del servicio en minutos
     * @param {Object} config - Configuración del barbero
     * @returns {Array} - Slots disponibles optimizados
     */
    static generateSmartSlots(workingHours, existingAppointments, serviceDuration, config) {
        const slots = [];
        const bufferTime = config?.bufferTime || 5; // Buffer configurable entre turnos consecutivos

        workingHours.forEach(workHour => {
            const startTime = new Date(`2000-01-01T${workHour.hora_inicio}`);
            const endTime = new Date(`2000-01-01T${workHour.hora_fin}`);

            // Generar slots desde el inicio del horario laboral
            let currentTime = new Date(startTime);
            
            while (currentTime < endTime) {
                const slotStart = currentTime.toTimeString().slice(0, 5);
                
                // Calcular hora de fin del slot usando la duración REAL del servicio
                const slotEnd = new Date(currentTime.getTime() + (serviceDuration * 60000));
                const slotEndStr = slotEnd.toTimeString().slice(0, 5);

                // Verificar que el slot no se extienda más allá del horario laboral
                if (slotEnd > endTime) {
                    break;
                }

                // Verificar si hay pausa en este horario
                const isInBreak = workHour.pausa_inicio && workHour.pausa_fin && 
                    slotStart < workHour.pausa_fin && slotEndStr > workHour.pausa_inicio;

                if (!isInBreak) {
                    // Verificar si el slot está ocupado
                    const isOccupied = existingAppointments.some(appointment => {
                        const appointmentStart = new Date(`2000-01-01T${appointment.hora_inicio}`);
                        const appointmentEnd = new Date(`2000-01-01T${appointment.hora_fin}`);
                        
                        const slotStartTime = new Date(currentTime);
                        const slotEndTime = new Date(slotEnd);
                        
                        // Hay conflicto si los slots se solapan
                        const hasConflict = (slotStartTime < appointmentEnd && slotEndTime > appointmentStart);
                        
                        if (hasConflict) {
                            console.log(`   ❌ Slot ${slotStart} - ${slotEndStr} CONFLICTA con cita ${appointment.hora_inicio} - ${appointment.hora_fin}`);
                        }
                        
                        return hasConflict;
                    });

                    if (!isOccupied) {
                        slots.push({
                            hora_inicio: slotStart,
                            hora_fin: slotEndStr,
                            disponible: true,
                            duracion: serviceDuration,
                            tiempo_total: `${serviceDuration} min`
                        });
                        console.log(`   ✅ Slot ${slotStart} - ${slotEndStr} DISPONIBLE`);
                    } else {
                        console.log(`   ❌ Slot ${slotStart} - ${slotEndStr} OCUPADO`);
                    }
                }

                // Avanzar al siguiente slot (duración del servicio + buffer)
                // IMPORTANTE: Usar serviceDuration, NO bufferTime para la duración del slot
                currentTime = new Date(slotEnd.getTime() + (bufferTime * 60000));
            }
        });

        return slots;
    }

    /**
     * Obtener el barbero principal (el que tiene más servicios y horarios)
     * @returns {Promise<Object|null>} - Información del barbero principal
     */
    static async getMainBarber() {
        try {
            const sql = `
                SELECT 
                    u.id,
                    u.nombre,
                    u.apellido,
                    u.nombre_barberia,
                    u.rol,
                    COUNT(DISTINCT s.id) as servicios_count,
                    COUNT(DISTINCT h.id) as horarios_count
                FROM usuarios u
                LEFT JOIN servicios s ON u.id = s.id_usuario AND s.estado = 'activo'
                LEFT JOIN horarios_laborales h ON u.id = h.id_usuario AND h.estado = 'activo'
                WHERE (u.rol = 'barbero' OR u.rol = 'admin') AND u.estado = 'activo'
                GROUP BY u.id, u.nombre, u.apellido, u.nombre_barberia, u.rol
                ORDER BY servicios_count DESC, horarios_count DESC
                LIMIT 1
            `;

            const [barbero] = await query(sql);
            return barbero || null;
        } catch (error) {
            console.error('Error al obtener barbero/administrador principal:', error);
            return null;
        }
    }

    /**
     * Verificar si es un día especial
     * @param {number} id_usuario - ID del usuario/barbero
     * @param {string} fecha - Fecha a verificar
     * @returns {Promise<Object|null>} - Información del día especial
     */
    static async checkSpecialDay(id_usuario, fecha) {
        try {
            const sql = `
                SELECT tipo, descripcion, todo_dia, hora_inicio, hora_fin
                FROM dias_especiales
                WHERE id_usuario = ? AND fecha = ?
            `;

            const [specialDay] = await query(sql, [id_usuario, fecha]);
            return specialDay || null;
        } catch (error) {
            console.error('Error al verificar día especial:', error);
            return null;
        }
    }

    /**
     * Obtener configuración del barbero
     * @param {number} id_usuario - ID del usuario/barbero
     * @returns {Promise<Object>} - Configuración del barbero
     */
    static async getBarberConfig(id_usuario) {
        try {
            const sql = `
                SELECT 
                    intervalo_turnos,
                    anticipacion_reserva,
                    max_reservas_dia,
                    permitir_reservas_mismo_dia,
                    mostrar_precios,
                    notificaciones_email,
                    notificaciones_sms,
                    moneda,
                    zona_horaria
                FROM configuracion_barbero
                WHERE id_usuario = ?
            `;

            const [config] = await query(sql, [id_usuario]);
            
            // Configuración por defecto si no existe
            return config || {
                intervalo_turnos: 30,
                anticipacion_reserva: 1440,
                max_reservas_dia: 20,
                permitir_reservas_mismo_dia: true,
                mostrar_precios: true,
                notificaciones_email: true,
                notificaciones_sms: false,
                moneda: 'ARS',
                zona_horaria: 'America/Argentina/Buenos_Aires'
            };
        } catch (error) {
            console.error('Error al obtener configuración del barbero:', error);
            // Retornar configuración por defecto
            return {
                intervalo_turnos: 30,
                anticipacion_reserva: 1440,
                max_reservas_dia: 20,
                permitir_reservas_mismo_dia: true,
                mostrar_precios: true,
                notificaciones_email: true,
                notificaciones_sms: false,
                moneda: 'ARS',
                zona_horaria: 'America/Argentina/Buenos_Aires'
            };
        }
    }
}

module.exports = BookingController; 