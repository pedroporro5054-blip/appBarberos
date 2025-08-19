const { query } = require('../config/db');

class AppointmentService {
    /**
     * Marcar turnos como completados automáticamente
     * Esta función se ejecuta para turnos que han pasado su hora de fin
     * y no han sido marcados manualmente como completados
     */
    static async autoCompleteAppointments() {
        try {
            console.log('🔄 Iniciando actualización automática de turnos...');
            
            // Obtener turnos que han pasado su hora de fin y están en estado pendiente
            const currentDate = new Date();
            const currentTime = currentDate.toTimeString().slice(0, 8); // HH:MM:SS
            const currentDateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
            
            const sql = `
                SELECT 
                    t.id,
                    t.fecha,
                    t.hora_fin,
                    t.estado,
                    t.id_usuario,
                    u.nombre as barbero_nombre,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    s.nombre as servicio_nombre
                FROM turnos t
                JOIN usuarios u ON t.id_usuario = u.id
                JOIN clientes c ON t.id_cliente = c.id
                JOIN servicios s ON t.id_servicio = s.id
                WHERE t.fecha <= ?
                AND t.hora_fin < ?
                AND t.estado IN ('reservado', 'confirmado', 'en_proceso')
                ORDER BY t.fecha ASC, t.hora_fin ASC
            `;
            
            const appointments = await query(sql, [currentDateStr, currentTime]);
            
            if (appointments.length === 0) {
                console.log('✅ No hay turnos pendientes para marcar como completados');
                return {
                    success: true,
                    message: 'No hay turnos pendientes para actualizar',
                    updatedCount: 0,
                    appointments: []
                };
            }
            
            console.log(`📋 Encontrados ${appointments.length} turnos para marcar como completados`);
            
            let updatedCount = 0;
            const updatedAppointments = [];
            
            // Actualizar cada turno
            for (const appointment of appointments) {
                try {
                    // Marcar como completado
                    await query(`
                        UPDATE turnos 
                        SET estado = 'completado', 
                            actualizado_en = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [appointment.id]);
                    
                    updatedCount++;
                    updatedAppointments.push({
                        id: appointment.id,
                        fecha: appointment.fecha,
                        hora_fin: appointment.hora_fin,
                        barbero: appointment.barbero_nombre,
                        cliente: `${appointment.cliente_nombre} ${appointment.cliente_apellido}`,
                        servicio: appointment.servicio_nombre,
                        estado_anterior: appointment.estado,
                        estado_nuevo: 'completado'
                    });
                    
                    console.log(`✅ Turno ${appointment.id} marcado como completado (${appointment.fecha} ${appointment.hora_fin})`);
                    
                } catch (error) {
                    console.error(`❌ Error actualizando turno ${appointment.id}:`, error);
                }
            }
            
            console.log(`🎯 Proceso completado: ${updatedCount}/${appointments.length} turnos actualizados`);
            
            return {
                success: true,
                message: `Se marcaron ${updatedCount} turnos como completados automáticamente`,
                updatedCount,
                appointments: updatedAppointments
            };
            
        } catch (error) {
            console.error('❌ Error en autoCompleteAppointments:', error);
            throw new Error('Error al actualizar turnos automáticamente');
        }
    }
    
    /**
     * Obtener estadísticas de turnos automáticos
     */
    static async getAutoCompleteStats() {
        try {
            const currentDate = new Date();
            const currentTime = currentDate.toTimeString().slice(0, 8);
            const currentDateStr = currentDate.toISOString().split('T')[0];
            
            // Contar turnos que serían marcados como completados
            const pendingSql = `
                SELECT COUNT(*) as count
                FROM turnos
                WHERE fecha <= ?
                AND hora_fin < ?
                AND estado IN ('reservado', 'confirmado', 'en_proceso')
            `;
            
            const [pendingResult] = await query(pendingSql, [currentDateStr, currentTime]);
            
            // Contar turnos ya completados hoy
            const completedTodaySql = `
                SELECT COUNT(*) as count
                FROM turnos
                WHERE fecha = ?
                AND estado = 'completado'
            `;
            
            const [completedTodayResult] = await query(completedTodaySql, [currentDateStr]);
            
            // Contar turnos completados automáticamente hoy
            const autoCompletedTodaySql = `
                SELECT COUNT(*) as count
                FROM turnos
                WHERE fecha = ?
                AND estado = 'completado'
                AND actualizado_en >= ?
            `;
            
            const todayStart = `${currentDateStr} 00:00:00`;
            const [autoCompletedTodayResult] = await query(autoCompletedTodaySql, [currentDateStr, todayStart]);
            
            return {
                pendingForAutoComplete: pendingResult.count,
                completedToday: completedTodayResult.count,
                autoCompletedToday: autoCompletedTodayResult.count,
                currentTime: currentTime,
                currentDate: currentDateStr
            };
            
        } catch (error) {
            console.error('Error obteniendo estadísticas de auto-completado:', error);
            throw error;
        }
    }
    
    /**
     * Verificar si un turno específico debería ser marcado como completado
     */
    static async shouldAutoComplete(appointmentId) {
        try {
            const sql = `
                SELECT 
                    fecha, 
                    hora_fin, 
                    estado
                FROM turnos 
                WHERE id = ?
            `;
            
            const [appointment] = await query(sql, [appointmentId]);
            
            if (!appointment) {
                return { shouldComplete: false, reason: 'Turno no encontrado' };
            }
            
            const currentDate = new Date();
            const currentTime = currentDate.toTimeString().slice(0, 8);
            const currentDateStr = currentDate.toISOString().split('T')[0];
            
            const shouldComplete = 
                appointment.fecha <= currentDateStr &&
                appointment.hora_fin < currentTime &&
                ['reservado', 'confirmado', 'en_proceso'].includes(appointment.estado);
            
            return {
                shouldComplete,
                reason: shouldComplete 
                    ? 'Turno ha pasado su hora de fin y está en estado pendiente'
                    : 'Turno no cumple condiciones para auto-completado',
                appointment,
                currentTime,
                currentDate: currentDateStr
            };
            
        } catch (error) {
            console.error('Error verificando auto-completado:', error);
            throw error;
        }
    }
}

module.exports = AppointmentService;
