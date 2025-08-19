const { query } = require('../config/db');

class Client {
    /**
     * Crear un nuevo cliente
     * @param {Object} clientData - Datos del cliente
     * @returns {Promise<Object>} - Cliente creado
     */
    static async create(clientData) {
        try {
            const {
                nombre,
                apellido,
                email = null,
                telefono,
                fecha_nacimiento = null,
                notas = null
            } = clientData;

            const sql = `
                INSERT INTO clientes (
                    nombre, apellido, email, telefono, 
                    fecha_nacimiento, notas
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            const result = await query(sql, [
                nombre, apellido, email, telefono, 
                fecha_nacimiento, notas
            ]);

            return {
                id: result.insertId,
                ...clientData
            };
        } catch (error) {
            console.error('Error al crear cliente:', error);
            throw new Error('Error al crear el cliente');
        }
    }

    /**
     * Buscar cliente por ID
     * @param {number} id - ID del cliente
     * @returns {Promise<Object|null>} - Cliente encontrado
     */
    static async findById(id) {
        try {
            const sql = 'SELECT * FROM clientes WHERE id = ?';
            const [client] = await query(sql, [id]);
            return client || null;
        } catch (error) {
            console.error('Error al buscar cliente por ID:', error);
            throw new Error('Error al buscar el cliente');
        }
    }

    /**
     * Buscar cliente por email
     * @param {string} email - Email del cliente
     * @returns {Promise<Object|null>} - Cliente encontrado
     */
    static async findByEmail(email) {
        try {
            const sql = 'SELECT * FROM clientes WHERE email = ?';
            const [client] = await query(sql, [email]);
            return client || null;
        } catch (error) {
            console.error('Error al buscar cliente por email:', error);
            throw new Error('Error al buscar el cliente');
        }
    }

    /**
     * Buscar cliente por teléfono
     * @param {string} telefono - Teléfono del cliente
     * @returns {Promise<Object|null>} - Cliente encontrado
     */
    static async findByPhone(telefono) {
        try {
            const sql = 'SELECT * FROM clientes WHERE telefono = ?';
            const [client] = await query(sql, [telefono]);
            return client || null;
        } catch (error) {
            console.error('Error al buscar cliente por teléfono:', error);
            throw new Error('Error al buscar el cliente');
        }
    }

    /**
     * NUEVA FUNCIÓN MEJORADA: Buscar o crear cliente por teléfono (identificador único)
     * @param {Object} clientData - Datos del cliente
     * @returns {Promise<Object>} - Cliente encontrado o creado
     */
    static async findOrCreateByPhone(clientData) {
        try {
            const { nombre, apellido, telefono, email = null, notas = null } = clientData;

            console.log('🔍 Buscando cliente por teléfono:', telefono);

            // Buscar cliente por teléfono exacto
            const existingClient = await this.findByPhone(telefono);
            
            if (existingClient) {
                console.log('✅ Cliente encontrado:', existingClient.nombre, existingClient.apellido, '(ID:', existingClient.id + ')');
                
                // Actualizar información del cliente si es necesario
                const updateData = {
                    nombre: nombre.trim(),
                    apellido: apellido.trim(),
                    email: email ? email.trim() : existingClient.email,
                    notas: notas ? notas.trim() : existingClient.notas
                };

                // Solo actualizar si hay cambios
                if (updateData.nombre !== existingClient.nombre || 
                    updateData.apellido !== existingClient.apellido ||
                    updateData.email !== existingClient.email ||
                    updateData.notas !== existingClient.notas) {
                    
                    console.log('🔄 Actualizando información del cliente...');
                    await this.update(existingClient.id, updateData);
                    
                    // Retornar cliente actualizado
                    return await this.findById(existingClient.id);
                }
                
                return existingClient;
            } else {
                console.log('🆕 Creando nuevo cliente...');
                // Crear nuevo cliente
                return await this.create(clientData);
            }
        } catch (error) {
            console.error('Error en findOrCreateByPhone:', error);
            throw new Error('Error al buscar o crear el cliente');
        }
    }

    /**
     * Función original findOrCreate (mantener para compatibilidad)
     * @param {Object} clientData - Datos del cliente
     * @returns {Promise<Object>} - Cliente encontrado o creado
     */
    static async findOrCreate(clientData) {
        try {
            const { email, telefono } = clientData;

            // Buscar por email si existe
            if (email) {
                const existingByEmail = await this.findByEmail(email);
                if (existingByEmail) {
                    return existingByEmail;
                }
            }

            // Buscar por teléfono
            const existingByPhone = await this.findByPhone(telefono);
            if (existingByPhone) {
                return existingByPhone;
            }

            // Si no existe, crear nuevo cliente
            return await this.create(clientData);
        } catch (error) {
            console.error('Error en findOrCreate cliente:', error);
            throw new Error('Error al buscar o crear el cliente');
        }
    }

    /**
     * Actualizar cliente
     * @param {number} id - ID del cliente
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<boolean>} - true si se actualizó correctamente
     */
    static async update(id, updateData) {
        try {
            const {
                nombre,
                apellido,
                email,
                telefono,
                fecha_nacimiento,
                notas
            } = updateData;

            const sql = `
                UPDATE clientes 
                SET nombre = ?, apellido = ?, email = ?, telefono = ?,
                    fecha_nacimiento = ?, notas = ?, actualizado_en = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const result = await query(sql, [
                nombre, apellido, email, telefono, 
                fecha_nacimiento, notas, id
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            throw new Error('Error al actualizar el cliente');
        }
    }

    /**
     * Obtener todos los clientes de un barbero
     * @param {number} id_usuario - ID del barbero
     * @param {number} limit - Límite de resultados
     * @param {number} offset - Offset para paginación
     * @returns {Promise<Array>} - Lista de clientes
     */
    static async findByBarber(id_usuario, limit = 50, offset = 0) {
        try {
            const sql = `
                SELECT DISTINCT c.*, 
                       COUNT(t.id) as total_citas,
                       MAX(t.fecha) as ultima_cita
                FROM clientes c
                LEFT JOIN turnos t ON c.id = t.id_cliente AND t.id_usuario = ?
                GROUP BY c.id
                ORDER BY c.nombre ASC, c.apellido ASC
                LIMIT ? OFFSET ?
            `;

            const clients = await query(sql, [id_usuario, limit, offset]);
            return clients;
        } catch (error) {
            console.error('Error al buscar clientes por barbero:', error);
            throw new Error('Error al buscar los clientes');
        }
    }

    /**
     * NUEVA FUNCIÓN: Obtener clientes frecuentes usando la vista
     * @param {number} id_usuario - ID del barbero
     * @param {number} limit - Límite de resultados
     * @returns {Promise<Array>} - Lista de clientes frecuentes
     */
    static async getFrequentClients(id_usuario, limit = 10) {
        try {
            const sql = `
                SELECT cf.*
                FROM clientes_frecuentes cf
                JOIN turnos t ON cf.id = t.id_cliente
                WHERE t.id_usuario = ?
                GROUP BY cf.id
                ORDER BY cf.total_citas DESC, cf.ultima_cita DESC
                LIMIT ?
            `;

            const clients = await query(sql, [id_usuario, limit]);
            return clients;
        } catch (error) {
            console.error('Error al obtener clientes frecuentes:', error);
            throw new Error('Error al obtener clientes frecuentes');
        }
    }

    /**
     * NUEVA FUNCIÓN: Obtener clientes nuevos usando la vista
     * @param {number} id_usuario - ID del barbero
     * @param {number} limit - Límite de resultados
     * @returns {Promise<Array>} - Lista de clientes nuevos
     */
    static async getNewClients(id_usuario, limit = 10) {
        try {
            const sql = `
                SELECT cn.*
                FROM clientes_nuevos cn
                JOIN turnos t ON cn.id = t.id_cliente
                WHERE t.id_usuario = ?
                GROUP BY cn.id
                ORDER BY cn.primera_cita DESC
                LIMIT ?
            `;

            const clients = await query(sql, [id_usuario, limit]);
            return clients;
        } catch (error) {
            console.error('Error al obtener clientes nuevos:', error);
            throw new Error('Error al obtener clientes nuevos');
        }
    }

    /**
     * Buscar clientes por nombre o apellido
     * @param {number} id_usuario - ID del barbero
     * @param {string} searchTerm - Término de búsqueda
     * @param {number} limit - Límite de resultados
     * @returns {Promise<Array>} - Lista de clientes encontrados
     */
    static async searchByName(id_usuario, searchTerm, limit = 20) {
        try {
            const sql = `
                SELECT DISTINCT c.*, 
                       COUNT(t.id) as total_citas
                FROM clientes c
                LEFT JOIN turnos t ON c.id = t.id_cliente AND t.id_usuario = ?
                WHERE (c.nombre LIKE ? OR c.apellido LIKE ? OR CONCAT(c.nombre, ' ', c.apellido) LIKE ?)
                GROUP BY c.id
                ORDER BY c.nombre ASC, c.apellido ASC
                LIMIT ?
            `;

            const searchPattern = `%${searchTerm}%`;
            const clients = await query(sql, [
                id_usuario, searchPattern, searchPattern, searchPattern, limit
            ]);

            return clients;
        } catch (error) {
            console.error('Error al buscar clientes por nombre:', error);
            throw new Error('Error al buscar clientes');
        }
    }

    /**
     * Obtener estadísticas de clientes para un barbero
     * @param {number} id_usuario - ID del barbero
     * @returns {Promise<Object>} - Estadísticas de clientes
     */
    static async getStats(id_usuario) {
        try {
            const sql = `
                SELECT 
                    COUNT(DISTINCT c.id) as total_clientes,
                    COUNT(DISTINCT CASE WHEN t.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN c.id END) as clientes_nuevos,
                    COUNT(DISTINCT CASE WHEN t.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN c.id END) as clientes_semana,
                    COUNT(DISTINCT CASE WHEN t.fecha = CURDATE() THEN c.id END) as clientes_hoy,
                    AVG(client_stats.total_citas) as promedio_citas_por_cliente
                FROM clientes c
                LEFT JOIN turnos t ON c.id = t.id_cliente AND t.id_usuario = ?
                LEFT JOIN (
                    SELECT c2.id, COUNT(t2.id) as total_citas
                    FROM clientes c2
                    JOIN turnos t2 ON c2.id = t2.id_cliente
                    WHERE t2.id_usuario = ?
                    GROUP BY c2.id
                ) client_stats ON c.id = client_stats.id
            `;

            const [stats] = await query(sql, [id_usuario, id_usuario]);
            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas de clientes:', error);
            throw new Error('Error al obtener estadísticas de clientes');
        }
    }

    /**
     * Actualizar contador de visitas del cliente
     * @param {number} id - ID del cliente
     * @returns {Promise<boolean>} - true si se actualizó correctamente
     */
    static async incrementVisits(id) {
        try {
            const sql = `
                UPDATE clientes 
                SET total_visitas = total_visitas + 1,
                    ultima_visita = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const result = await query(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al incrementar visitas del cliente:', error);
            throw new Error('Error al actualizar visitas del cliente');
        }
    }

    /**
     * Eliminar cliente (solo si no tiene citas)
     * @param {number} id - ID del cliente
     * @returns {Promise<boolean>} - true si se eliminó correctamente
     */
    static async delete(id) {
        try {
            // Verificar si el cliente tiene citas
            const sqlCheck = 'SELECT COUNT(*) as count FROM turnos WHERE id_cliente = ?';
            const [result] = await query(sqlCheck, [id]);

            if (result.count > 0) {
                throw new Error('No se puede eliminar un cliente que tiene citas registradas');
            }

            const sqlDelete = 'DELETE FROM clientes WHERE id = ?';
            const deleteResult = await query(sqlDelete, [id]);

            return deleteResult.affectedRows > 0;
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            throw error;
        }
    }

    /**
     * Obtener historial de citas de un cliente
     * @param {number} id_cliente - ID del cliente
     * @param {number} id_usuario - ID del barbero
     * @param {number} limit - Límite de resultados
     * @returns {Promise<Array>} - Historial de citas
     */
    static async getAppointmentHistory(id_cliente, id_usuario, limit = 20) {
        try {
            const sql = `
                SELECT t.*, s.nombre as servicio_nombre, s.precio as servicio_precio
                FROM turnos t
                JOIN servicios s ON t.id_servicio = s.id
                WHERE t.id_cliente = ? AND t.id_usuario = ?
                ORDER BY t.fecha DESC, t.hora_inicio DESC
                LIMIT ?
            `;

            const appointments = await query(sql, [id_cliente, id_usuario, limit]);
            return appointments;
        } catch (error) {
            console.error('Error al obtener historial de citas:', error);
            throw new Error('Error al obtener historial de citas');
        }
    }
}

module.exports = Client; 