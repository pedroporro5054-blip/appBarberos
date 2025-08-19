const AppointmentService = require('../services/appointmentService');

class AppointmentController {
    /**
     * Ejecutar actualización automática de turnos
     * Endpoint para ejecutar manualmente la actualización
     */
    static async runAutoComplete(req, res) {
        try {
            console.log('🚀 Solicitud manual de actualización automática de turnos');
            
            const result = await AppointmentService.autoCompleteAppointments();
            
            res.json({
                success: true,
                message: result.message,
                data: result
            });
            
        } catch (error) {
            console.error('Error ejecutando auto-completado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al ejecutar actualización automática',
                error: error.message
            });
        }
    }
    
    /**
     * Obtener estadísticas de auto-completado
     */
    static async getAutoCompleteStats(req, res) {
        try {
            const stats = await AppointmentService.getAutoCompleteStats();
            
            res.json({
                success: true,
                data: stats
            });
            
        } catch (error) {
            console.error('Error obteniendo estadísticas de auto-completado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
                error: error.message
            });
        }
    }
    
    /**
     * Verificar si un turno específico debería ser auto-completado
     */
    static async checkAutoCompleteStatus(req, res) {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de turno requerido'
                });
            }
            
            const result = await AppointmentService.shouldAutoComplete(id);
            
            res.json({
                success: true,
                data: result
            });
            
        } catch (error) {
            console.error('Error verificando estado de auto-completado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar estado',
                error: error.message
            });
        }
    }
    
    /**
     * Obtener turnos pendientes de auto-completado
     */
    static async getPendingAutoComplete(req, res) {
        try {
            const currentDate = new Date();
            const currentTime = currentDate.toTimeString().slice(0, 8);
            const currentDateStr = currentDate.toISOString().split('T')[0];
            
            const { query } = require('../config/db');
            
            const sql = `
                SELECT 
                    t.id,
                    t.fecha,
                    t.hora_inicio,
                    t.hora_fin,
                    t.estado,
                    t.precio_final,
                    t.id_usuario,
                    u.nombre as barbero_nombre,
                    c.nombre as cliente_nombre,
                    c.apellido as cliente_apellido,
                    c.telefono as cliente_telefono,
                    s.nombre as servicio_nombre,
                    s.precio as servicio_precio
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
            
            res.json({
                success: true,
                data: {
                    appointments,
                    count: appointments.length,
                    currentTime,
                    currentDate: currentDateStr
                }
            });
            
        } catch (error) {
            console.error('Error obteniendo turnos pendientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener turnos pendientes',
                error: error.message
            });
        }
    }
}

module.exports = AppointmentController;
