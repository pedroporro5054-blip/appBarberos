const { query, getConnection } = require('../config/db');

// Obtener todos los horarios laborales del usuario
async function getWorkingHours(req, res) {
    try {
        const userId = req.user.id;
        
        const horarios = await query(`
            SELECT 
                id,
                dia_semana,
                hora_inicio,
                hora_fin,
                pausa_inicio,
                pausa_fin,
                estado
            FROM horarios_laborales 
            WHERE id_usuario = ?
            ORDER BY 
                CASE dia_semana 
                    WHEN 'lunes' THEN 1
                    WHEN 'martes' THEN 2
                    WHEN 'miercoles' THEN 3
                    WHEN 'jueves' THEN 4
                    WHEN 'viernes' THEN 5
                    WHEN 'sabado' THEN 6
                    WHEN 'domingo' THEN 7
                END
        `, [userId]);

        res.json({
            success: true,
            data: horarios
        });
    } catch (error) {
        console.error('Error obteniendo horarios laborales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los horarios laborales'
        });
    }
}

// Crear o actualizar horario laboral
async function saveWorkingHour(req, res) {
    try {
        const userId = req.user.id;
        const { dia_semana, hora_inicio, hora_fin, pausa_inicio, pausa_fin, estado } = req.body;

        // Validaciones
        if (!dia_semana || !hora_inicio || !hora_fin) {
            return res.status(400).json({
                success: false,
                message: 'Día de la semana, hora de inicio y fin son requeridos'
            });
        }

        // Verificar que la hora de fin sea posterior a la de inicio
        if (hora_inicio >= hora_fin) {
            return res.status(400).json({
                success: false,
                message: 'La hora de fin debe ser posterior a la hora de inicio'
            });
        }

        // Verificar que la pausa esté dentro del horario laboral
        if (pausa_inicio && pausa_fin) {
            if (pausa_inicio < hora_inicio || pausa_fin > hora_fin || pausa_inicio >= pausa_fin) {
                return res.status(400).json({
                    success: false,
                    message: 'La pausa debe estar dentro del horario laboral'
                });
            }
        }

        const connection = await getConnection();
        
        try {
            // Verificar si ya existe un horario para este día
            const existingSchedule = await query(`
                SELECT id FROM horarios_laborales 
                WHERE id_usuario = ? AND dia_semana = ?
            `, [userId, dia_semana]);

            if (existingSchedule.length > 0) {
                // Actualizar horario existente
                await query(`
                    UPDATE horarios_laborales 
                    SET hora_inicio = ?, hora_fin = ?, pausa_inicio = ?, pausa_fin = ?, estado = ?
                    WHERE id_usuario = ? AND dia_semana = ?
                `, [hora_inicio, hora_fin, pausa_inicio, pausa_fin, estado, userId, dia_semana]);

                res.json({
                    success: true,
                    message: 'Horario actualizado exitosamente',
                    data: { id: existingSchedule[0].id }
                });
            } else {
                // Crear nuevo horario
                const result = await query(`
                    INSERT INTO horarios_laborales (id_usuario, dia_semana, hora_inicio, hora_fin, pausa_inicio, pausa_fin, estado)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [userId, dia_semana, hora_inicio, hora_fin, pausa_inicio, pausa_fin, estado]);

                res.json({
                    success: true,
                    message: 'Horario creado exitosamente',
                    data: { id: result.insertId }
                });
            }
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error guardando horario laboral:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar el horario laboral'
        });
    }
}

// Eliminar horario laboral
async function deleteWorkingHour(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await query(`
            DELETE FROM horarios_laborales 
            WHERE id = ? AND id_usuario = ?
        `, [id, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Horario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Horario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando horario laboral:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el horario laboral'
        });
    }
}

// Obtener todos los días especiales del usuario
async function getSpecialDays(req, res) {
    try {
        const userId = req.user.id;
        
        const specialDays = await query(`
            SELECT 
                id,
                fecha,
                tipo,
                descripcion,
                todo_dia,
                hora_inicio,
                hora_fin
            FROM dias_especiales 
            WHERE id_usuario = ?
            ORDER BY fecha ASC
        `, [userId]);

        res.json({
            success: true,
            data: specialDays
        });
    } catch (error) {
        console.error('Error obteniendo días especiales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los días especiales'
        });
    }
}

// Crear día especial
async function createSpecialDay(req, res) {
    try {
        const userId = req.user.id;
        const { fecha, tipo, descripcion, todo_dia, hora_inicio, hora_fin } = req.body;

        // Validaciones
        if (!fecha || !tipo) {
            return res.status(400).json({
                success: false,
                message: 'Fecha y tipo son requeridos'
            });
        }

        // Verificar que la fecha no esté en el pasado
        const selectedDate = new Date(fecha);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden crear días especiales en fechas pasadas'
            });
        }

        // Verificar que no haya conflicto con horarios existentes
        if (!todo_dia && hora_inicio && hora_fin) {
            if (hora_inicio >= hora_fin) {
                return res.status(400).json({
                    success: false,
                    message: 'La hora de fin debe ser posterior a la hora de inicio'
                });
            }
        }

        const result = await query(`
            INSERT INTO dias_especiales (id_usuario, fecha, tipo, descripcion, todo_dia, hora_inicio, hora_fin)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [userId, fecha, tipo, descripcion, todo_dia, hora_inicio, hora_fin]);

        res.json({
            success: true,
            message: 'Día especial creado exitosamente',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error creando día especial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el día especial'
        });
    }
}

// Actualizar día especial
async function updateSpecialDay(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { fecha, tipo, descripcion, todo_dia, hora_inicio, hora_fin } = req.body;

        // Validaciones
        if (!fecha || !tipo) {
            return res.status(400).json({
                success: false,
                message: 'Fecha y tipo son requeridos'
            });
        }

        // Verificar que el día especial existe y pertenece al usuario
        const existingDay = await query(`
            SELECT id FROM dias_especiales 
            WHERE id = ? AND id_usuario = ?
        `, [id, userId]);

        if (existingDay.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Día especial no encontrado'
            });
        }

        // Verificar que la fecha no esté en el pasado
        const selectedDate = new Date(fecha);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden modificar días especiales en fechas pasadas'
            });
        }

        await query(`
            UPDATE dias_especiales 
            SET fecha = ?, tipo = ?, descripcion = ?, todo_dia = ?, hora_inicio = ?, hora_fin = ?
            WHERE id = ? AND id_usuario = ?
        `, [fecha, tipo, descripcion, todo_dia, hora_inicio, hora_fin, id, userId]);

        res.json({
            success: true,
            message: 'Día especial actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error actualizando día especial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el día especial'
        });
    }
}

// Eliminar día especial
async function deleteSpecialDay(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await query(`
            DELETE FROM dias_especiales 
            WHERE id = ? AND id_usuario = ?
        `, [id, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Día especial no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Día especial eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando día especial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el día especial'
        });
    }
}

// Obtener configuración de horarios del barbero
async function getScheduleConfig(req, res) {
    try {
        const userId = req.user.id;
        
        const config = await query(`
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
        `, [userId]);

        if (config.length === 0) {
            // Crear configuración por defecto si no existe
            await query(`
                INSERT INTO configuracion_barbero (
                    id_usuario, intervalo_turnos, anticipacion_reserva, 
                    max_reservas_dia, permitir_reservas_mismo_dia
                ) VALUES (?, 30, 1440, 20, 1)
            `, [userId]);

            res.json({
                success: true,
                data: {
                    intervalo_turnos: 30,
                    anticipacion_reserva: 1440,
                    max_reservas_dia: 20,
                    permitir_reservas_mismo_dia: true,
                    mostrar_precios: true,
                    notificaciones_email: true,
                    notificaciones_sms: false,
                    moneda: 'ARS',
                    zona_horaria: 'America/Argentina/Buenos_Aires'
                }
            });
        } else {
            res.json({
                success: true,
                data: config[0]
            });
        }
    } catch (error) {
        console.error('Error obteniendo configuración de horarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la configuración'
        });
    }
}

// Actualizar configuración de horarios
async function updateScheduleConfig(req, res) {
    try {
        const userId = req.user.id;
        const { 
            intervalo_turnos, 
            anticipacion_reserva, 
            max_reservas_dia, 
            permitir_reservas_mismo_dia 
        } = req.body;

        // Validaciones
        if (!intervalo_turnos || !anticipacion_reserva || !max_reservas_dia) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos de configuración son requeridos'
            });
        }

        // Verificar si ya existe configuración
        const existingConfig = await query(`
            SELECT id FROM configuracion_barbero WHERE id_usuario = ?
        `, [userId]);

        if (existingConfig.length > 0) {
            // Actualizar configuración existente
            await query(`
                UPDATE configuracion_barbero 
                SET intervalo_turnos = ?, anticipacion_reserva = ?, 
                    max_reservas_dia = ?, permitir_reservas_mismo_dia = ?
                WHERE id_usuario = ?
            `, [intervalo_turnos, anticipacion_reserva, max_reservas_dia, permitir_reservas_mismo_dia, userId]);
        } else {
            // Crear nueva configuración
            await query(`
                INSERT INTO configuracion_barbero (
                    id_usuario, intervalo_turnos, anticipacion_reserva, 
                    max_reservas_dia, permitir_reservas_mismo_dia
                ) VALUES (?, ?, ?, ?, ?)
            `, [userId, intervalo_turnos, anticipacion_reserva, max_reservas_dia, permitir_reservas_mismo_dia]);
        }

        res.json({
            success: true,
            message: 'Configuración actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error actualizando configuración de horarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la configuración'
        });
    }
}

module.exports = {
    getWorkingHours,
    saveWorkingHour,
    deleteWorkingHour,
    getSpecialDays,
    createSpecialDay,
    updateSpecialDay,
    deleteSpecialDay,
    getScheduleConfig,
    updateScheduleConfig
}; 