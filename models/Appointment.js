const { query } = require('../config/db');

class Appointment {
    /**
     * Crear una nueva cita/turno
     * @param {Object} appointmentData - Datos de la cita
     * @returns {Promise<Object>} - Cita creada
     */
    static async create(appointmentData) {
        try {
            const {
                fecha,
                hora_inicio,
                hora_fin,
                id_cliente,
                id_usuario,
                id_servicio,
                precio_final,
                codigo_cancelacion,
                notas = null,
                metodo_pago = 'efectivo'
            } = appointmentData;

            const sql = `
                INSERT INTO turnos (
                    fecha, hora_inicio, hora_fin, id_cliente, id_usuario, 
                    id_servicio, precio_final, codigo_cancelacion, notas, 
                    metodo_pago, estado
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'reservado')
            `;

            const result = await query(sql, [
                fecha, hora_inicio, hora_fin, id_cliente, id_usuario,
                id_servicio, precio_final, codigo_cancelacion, notas, metodo_pago
            ]);

            return {
                id: result.insertId,
                ...appointmentData,
                estado: 'reservado'
            };
        } catch (error) {
            console.error('Error al crear cita:', error);
            throw new Error('Error al crear la cita');
        }
    }

    /**
     * Obtener una cita por ID
     * @param {number} id - ID de la cita
     * @returns {Promise<Object|null>} - Cita encontrada
     */
    static async findById(id) {
        try {
            const sql = `
                SELECT t.*, 
                       c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                       c.email as cliente_email, c.telefono as cliente_telefono,
                       s.nombre as servicio_nombre, s.descripcion as servicio_descripcion,
                       u.nombre as barbero_nombre, u.apellido as barbero_apellido
                FROM turnos t
                JOIN clientes c ON t.id_cliente = c.id
                JOIN servicios s ON t.id_servicio = s.id
                JOIN usuarios u ON t.id_usuario = u.id
                WHERE t.id = ?
            `;

            const [appointment] = await query(sql, [id]);
            return appointment || null;
        } catch (error) {
            console.error('Error al buscar cita por ID:', error);
            throw new Error('Error al buscar la cita');
        }
    }

    /**
     * Obtener citas por barbero/usuario
     * @param {number} id_usuario - ID del barbero
     * @param {string} fecha - Fecha específica (opcional)
     * @returns {Promise<Array>} - Lista de citas
     */
    static async findByBarber(id_usuario, fecha = null) {
        try {
            let sql = `
                SELECT t.*, 
                       c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                       c.email as cliente_email, c.telefono as cliente_telefono,
                       s.nombre as servicio_nombre, s.precio as servicio_precio,
                       'Configurado' as servicio_duracion
                FROM turnos t
                JOIN clientes c ON t.id_cliente = c.id
                JOIN servicios s ON t.id_servicio = s.id
                WHERE t.id_usuario = ?
            `;

            const params = [id_usuario];

            if (fecha) {
                sql += ' AND t.fecha = ?';
                params.push(fecha);
            }

            sql += ' ORDER BY t.fecha ASC, t.hora_inicio ASC';

            const appointments = await query(sql, params);
            return appointments;
        } catch (error) {
            console.error('Error al buscar citas por barbero:', error);
            throw new Error('Error al buscar las citas');
        }
    }

    /**
     * Obtener citas del día para un barbero
     * @param {number} id_usuario - ID del barbero
     * @param {string} fecha - Fecha del día
     * @returns {Promise<Array>} - Lista de citas del día
     */
    static async getTodayAppointments(id_usuario, fecha) {
        try {
            const sql = `
                SELECT t.*, 
                       c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                       c.telefono as cliente_telefono,
                       s.nombre as servicio_nombre, s.precio as servicio_precio
                FROM turnos t
                JOIN clientes c ON t.id_cliente = c.id
                JOIN servicios s ON t.id_servicio = s.id
                WHERE t.id_usuario = ? 
                AND t.fecha = ? 
                AND t.estado IN ('reservado', 'confirmado', 'en_proceso')
                ORDER BY t.hora_inicio ASC
            `;

            const appointments = await query(sql, [id_usuario, fecha]);
            console.log(`🔍 Citas activas encontradas para ${fecha}: ${appointments.length}`);
            if (appointments.length > 0) {
                appointments.forEach(app => {
                    console.log(`   - ${app.hora_inicio} - ${app.hora_fin} (${app.estado})`);
                });
            }
            return appointments;
        } catch (error) {
            console.error('Error al obtener citas del día:', error);
            throw new Error('Error al obtener las citas del día');
        }
    }

    /**
     * Verificar disponibilidad de horario
     * @param {number} id_usuario - ID del barbero
     * @param {string} fecha - Fecha
     * @param {string} hora_inicio - Hora de inicio
     * @param {string} hora_fin - Hora de fin
     * @param {number} exclude_id - ID de cita a excluir (para actualizaciones)
     * @returns {Promise<boolean>} - true si está disponible
     */
    static async checkAvailability(id_usuario, fecha, hora_inicio, hora_fin, exclude_id = null) {
        try {
            let sql = `
                SELECT COUNT(*) as count
                FROM turnos
                WHERE id_usuario = ? 
                AND fecha = ? 
                AND estado NOT IN ('cancelado', 'no_show')
                AND (
                    (hora_inicio < ? AND hora_fin > ?)
                )
            `;

            const params = [id_usuario, fecha, hora_fin, hora_inicio];

            if (exclude_id) {
                sql += ' AND id != ?';
                params.push(exclude_id);
            }

            const [result] = await query(sql, params);
            return result.count === 0;
        } catch (error) {
            console.error('Error al verificar disponibilidad:', error);
            throw new Error('Error al verificar disponibilidad');
        }
    }

    /**
     * Actualizar estado de una cita
     * @param {number} id - ID de la cita
     * @param {string} estado - Nuevo estado
     * @returns {Promise<boolean>} - true si se actualizó correctamente
     */
    static async updateStatus(id, estado) {
        try {
            const sql = 'UPDATE turnos SET estado = ? WHERE id = ?';
            const result = await query(sql, [estado, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar estado de cita:', error);
            throw new Error('Error al actualizar el estado de la cita');
        }
    }

    /**
     * Cancelar una cita por código de cancelación
     * @param {string} codigo_cancelacion - Código de cancelación
     * @returns {Promise<Object|null>} - Cita cancelada
     */
    static async cancelByCode(codigo_cancelacion) {
        try {
            const sql = `
                UPDATE turnos 
                SET estado = 'cancelado' 
                WHERE codigo_cancelacion = ? AND estado IN ('reservado', 'confirmado')
            `;

            const result = await query(sql, [codigo_cancelacion]);
            
            if (result.affectedRows > 0) {
                return await this.findByCancelCode(codigo_cancelacion);
            }
            
            return null;
        } catch (error) {
            console.error('Error al cancelar cita por código:', error);
            throw new Error('Error al cancelar la cita');
        }
    }

    /**
     * Buscar cita por código de cancelación
     * @param {string} codigo_cancelacion - Código de cancelación
     * @returns {Promise<Object|null>} - Cita encontrada
     */
    static async findByCancelCode(codigo_cancelacion) {
        try {
            const sql = `
                SELECT t.*, 
                       c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                       c.email as cliente_email, c.telefono as cliente_telefono,
                       s.nombre as servicio_nombre
                FROM turnos t
                JOIN clientes c ON t.id_cliente = c.id
                JOIN servicios s ON t.id_servicio = s.id
                WHERE t.codigo_cancelacion = ?
            `;

            const [appointment] = await query(sql, [codigo_cancelacion]);
            return appointment || null;
        } catch (error) {
            console.error('Error al buscar cita por código:', error);
            throw new Error('Error al buscar la cita');
        }
    }

    /**
     * Generar código de cancelación único
     * @returns {Promise<string>} - Código único
     */
    static async generateCancelCode() {
        try {
            let code;
            let exists = true;
            
            while (exists) {
                code = Math.random().toString(36).substring(2, 8).toUpperCase();
                const sql = 'SELECT COUNT(*) as count FROM turnos WHERE codigo_cancelacion = ?';
                const [result] = await query(sql, [code]);
                exists = result.count > 0;
            }
            
            return code;
        } catch (error) {
            console.error('Error al generar código de cancelación:', error);
            throw new Error('Error al generar código de cancelación');
        }
    }

    /**
     * Obtener estadísticas de citas para un barbero
     * @param {number} id_usuario - ID del barbero
     * @param {string} fecha_inicio - Fecha de inicio
     * @param {string} fecha_fin - Fecha de fin
     * @returns {Promise<Object>} - Estadísticas
     */
    static async getStats(id_usuario, fecha_inicio, fecha_fin) {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_citas,
                    SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completadas,
                    SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as canceladas,
                    SUM(CASE WHEN estado = 'reservado' THEN 1 ELSE 0 END) as reservadas,
                    SUM(CASE WHEN estado = 'no_show' THEN 1 ELSE 0 END) as no_show,
                    SUM(CASE WHEN pagado = 1 THEN precio_final ELSE 0 END) as total_recaudado
                FROM turnos
                WHERE id_usuario = ? 
                AND fecha BETWEEN ? AND ?
            `;

            const [stats] = await query(sql, [id_usuario, fecha_inicio, fecha_fin]);
            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw new Error('Error al obtener estadísticas');
        }
    }

    /**
     * Obtener próximas citas para un barbero
     * @param {number} id_usuario - ID del barbero
     * @param {number} limit - Límite de resultados
     * @returns {Promise<Array>} - Próximas citas
     */
    static async getUpcomingAppointments(id_usuario, limit = 10) {
        try {
            const sql = `
                SELECT t.*, 
                       c.nombre as cliente_nombre, c.apellido as cliente_apellido,
                       c.telefono as cliente_telefono,
                       s.nombre as servicio_nombre, s.precio as servicio_precio
                FROM turnos t
                JOIN clientes c ON t.id_cliente = c.id
                JOIN servicios s ON t.id_servicio = s.id
                WHERE t.id_usuario = ? 
                AND t.fecha >= CURDATE()
                AND t.estado IN ('reservado', 'confirmado')
                ORDER BY t.fecha ASC, t.hora_inicio ASC
                LIMIT ?
            `;

            const appointments = await query(sql, [id_usuario, limit]);
            return appointments;
        } catch (error) {
            console.error('Error al obtener próximas citas:', error);
            throw new Error('Error al obtener próximas citas');
        }
    }
}

module.exports = Appointment; 