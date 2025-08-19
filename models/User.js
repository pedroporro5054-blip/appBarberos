const { query } = require('../config/db');

class User {
    // Crear un nuevo usuario
    static async create(userData) {
        const { 
            email, 
            password, 
            nombre, 
            apellido, 
            telefono, 
            nombreBarberia,
            direccion,
            descripcion,
            rol = 'barbero' 
        } = userData;
        
        const sql = `
            INSERT INTO usuarios (
                email, password, nombre, apellido, telefono, 
                nombre_barberia, direccion, descripcion, rol, 
                creado_en
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        try {
            const result = await query(sql, [
                email, password, nombre, apellido, telefono,
                nombreBarberia, direccion, descripcion, rol
            ]);
            
            const newUser = { id: result.insertId, ...userData };
            
            // Crear configuración por defecto para el barbero
            if (rol === 'barbero') {
                await this.createDefaultBarberConfig(result.insertId);
            }
            
            return newUser;
        } catch (error) {
            throw new Error(`Error al crear usuario: ${error.message}`);
        }
    }

    // Crear configuración por defecto para barbero
    static async createDefaultBarberConfig(userId) {
        const sql = `
            INSERT INTO configuracion_barbero (
                id_usuario, intervalo_turnos, anticipacion_reserva, 
                max_reservas_dia, permitir_reservas_mismo_dia, 
                mostrar_precios, notificaciones_email, notificaciones_sms, 
                moneda, zona_horaria
            ) VALUES (?, 30, 1440, 20, TRUE, TRUE, TRUE, FALSE, 'ARS', 'America/Argentina/Buenos_Aires')
        `;
        
        try {
            await query(sql, [userId]);
        } catch (error) {
            console.error('Error al crear configuración por defecto:', error);
            // No lanzar error para no afectar la creación del usuario
        }
    }

    // Buscar usuario por email
    static async findByEmail(email) {
        const sql = `
            SELECT 
                id, nombre, apellido, email, telefono, password,
                nombre_barberia, direccion, descripcion, avatar_url,
                estado, rol, creado_en, actualizado_en
            FROM usuarios 
            WHERE email = ?
        `;
        
        try {
            const rows = await query(sql, [email]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error al buscar usuario por email: ${error.message}`);
        }
    }

    // Buscar usuario por ID
    static async findById(id) {
        const sql = `
            SELECT 
                id, nombre, apellido, email, telefono, password,
                nombre_barberia, direccion, descripcion, avatar_url,
                estado, rol, creado_en, actualizado_en
            FROM usuarios 
            WHERE id = ?
        `;
        
        try {
            const rows = await query(sql, [id]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error al buscar usuario por ID: ${error.message}`);
        }
    }

    // Actualizar usuario
    static async update(id, updateData) {
        const allowedFields = [
            'nombre', 'apellido', 'telefono', 'email', 
            'nombre_barberia', 'direccion', 'descripcion', 'avatar_url'
        ];
        const updates = [];
        const values = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            throw new Error('No hay campos válidos para actualizar');
        }

        values.push(id);
        const sql = `UPDATE usuarios SET ${updates.join(', ')}, actualizado_en = NOW() WHERE id = ?`;

        try {
            const result = await query(sql, values);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar usuario: ${error.message}`);
        }
    }

    // Actualizar contraseña
    static async updatePassword(id, newPassword) {
        const sql = 'UPDATE usuarios SET password = ?, actualizado_en = NOW() WHERE id = ?';
        
        try {
            const result = await query(sql, [newPassword, id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar contraseña: ${error.message}`);
        }
    }

    // Eliminar usuario
    static async delete(id) {
        const sql = 'DELETE FROM usuarios WHERE id = ?';
        
        try {
            const result = await query(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar usuario: ${error.message}`);
        }
    }

    // Obtener todos los usuarios (con paginación)
    static async findAll(limit = 10, offset = 0) {
        const sql = `
            SELECT 
                id, email, nombre, apellido, telefono, 
                nombre_barberia, direccion, rol, estado,
                creado_en, actualizado_en
            FROM usuarios 
            ORDER BY creado_en DESC 
            LIMIT ? OFFSET ?
        `;
        
        try {
            const rows = await query(sql, [limit, offset]);
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener usuarios: ${error.message}`);
        }
    }

    // Contar total de usuarios
    static async count() {
        const sql = 'SELECT COUNT(*) as total FROM usuarios';
        
        try {
            const rows = await query(sql);
            return rows[0].total;
        } catch (error) {
            throw new Error(`Error al contar usuarios: ${error.message}`);
        }
    }

    // Buscar usuarios por rol
    static async findByRole(rol) {
        const sql = `
            SELECT 
                id, email, nombre, apellido, telefono, 
                nombre_barberia, direccion, rol, estado,
                creado_en, actualizado_en
            FROM usuarios 
            WHERE rol = ? 
            ORDER BY nombre
        `;
        
        try {
            const rows = await query(sql, [rol]);
            return rows;
        } catch (error) {
            throw new Error(`Error al buscar usuarios por rol: ${error.message}`);
        }
    }

    // Verificar si el email existe
    static async emailExists(email, excludeId = null) {
        let sql = 'SELECT COUNT(*) as count FROM usuarios WHERE email = ?';
        let params = [email];

        if (excludeId) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }

        try {
            const rows = await query(sql, params);
            return rows[0].count > 0;
        } catch (error) {
            throw new Error(`Error al verificar email: ${error.message}`);
        }
    }

    // Obtener configuración del barbero
    static async getBarberConfig(userId) {
        const sql = `
            SELECT * FROM configuracion_barbero 
            WHERE id_usuario = ?
        `;
        
        try {
            const rows = await query(sql, [userId]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error al obtener configuración del barbero: ${error.message}`);
        }
    }

    // Actualizar configuración del barbero
    static async updateBarberConfig(userId, configData) {
        const allowedFields = [
            'intervalo_turnos', 'anticipacion_reserva', 'max_reservas_dia',
            'permitir_reservas_mismo_dia', 'mostrar_precios', 
            'notificaciones_email', 'notificaciones_sms', 'moneda', 'zona_horaria'
        ];
        
        const updates = [];
        const values = [];

        for (const [key, value] of Object.entries(configData)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            throw new Error('No hay campos válidos para actualizar');
        }

        values.push(userId);
        const sql = `UPDATE configuracion_barbero SET ${updates.join(', ')} WHERE id_usuario = ?`;

        try {
            const result = await query(sql, values);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar configuración del barbero: ${error.message}`);
        }
    }

    // Obtener estadísticas de usuarios
    static async getStats() {
        const sql = `
            SELECT 
                COUNT(*) as total_usuarios,
                COUNT(CASE WHEN rol = 'admin' THEN 1 END) as total_admins,
                COUNT(CASE WHEN rol = 'barbero' THEN 1 END) as total_barberos,
                COUNT(CASE WHEN estado = 'activo' THEN 1 END) as usuarios_activos,
                COUNT(CASE WHEN DATE(creado_en) = CURDATE() THEN 1 END) as nuevos_hoy
            FROM usuarios
        `;

        try {
            const rows = await query(sql);
            return rows[0];
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }

    // Obtener estadísticas de usuarios para el panel de administración
    static async getUserStats() {
        const sql = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN rol = 'admin' THEN 1 END) as admins,
                COUNT(CASE WHEN rol = 'barbero' THEN 1 END) as barbers,
                COUNT(CASE WHEN estado = 'activo' THEN 1 END) as active,
                COUNT(CASE WHEN estado = 'inactivo' THEN 1 END) as inactive,
                COUNT(CASE WHEN creado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as newThisMonth
            FROM usuarios
            WHERE rol IN ('admin', 'barbero')
        `;
        
        try {
            const [result] = await query(sql);
            return {
                total: result.total || 0,
                admins: result.admins || 0,
                barbers: result.barbers || 0,
                active: result.active || 0,
                inactive: result.inactive || 0,
                newThisMonth: result.newThisMonth || 0
            };
        } catch (error) {
            throw new Error(`Error al obtener estadísticas de usuarios: ${error.message}`);
        }
    }

    // Buscar barberos y administradores activos
    static async findActiveBarbers() {
        const sql = `
            SELECT 
                id, nombre, apellido, email, nombre_barberia, 
                direccion, descripcion, avatar_url, rol
            FROM usuarios 
            WHERE (rol = 'barbero' OR rol = 'admin') AND estado = 'activo'
            ORDER BY rol DESC, nombre
        `;
        
        try {
            const rows = await query(sql);
            return rows;
        } catch (error) {
            throw new Error(`Error al buscar barberos y administradores activos: ${error.message}`);
        }
    }

    // Buscar barberos por administrador
    static async findEmployeesByAdmin(adminId) {
        const sql = `
            SELECT 
                id, nombre, apellido, email, telefono, nombre_barberia,
                direccion, descripcion, avatar_url, rol, estado,
                creado_en, actualizado_en
            FROM usuarios 
            WHERE id != ? AND rol IN ('barbero', 'admin')
            ORDER BY rol DESC, nombre
        `;
        
        try {
            const rows = await query(sql, [adminId]);
            return rows;
        } catch (error) {
            throw new Error(`Error al buscar barberos: ${error.message}`);
        }
    }

    // Cambiar estado de barbero
    static async toggleEmployeeStatus(employeeId, adminId) {
        const sql = `
            UPDATE usuarios 
            SET estado = CASE WHEN estado = 'activo' THEN 'inactivo' ELSE 'activo' END,
                actualizado_en = NOW()
            WHERE id = ? AND id != ?
        `;
        
        try {
            const result = await query(sql, [employeeId, adminId]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al cambiar estado del barbero: ${error.message}`);
        }
    }

    // Cambiar rol de barbero
    static async changeEmployeeRole(employeeId, newRole, adminId) {
        const allowedRoles = ['admin', 'barbero'];
        if (!allowedRoles.includes(newRole)) {
            throw new Error('Rol no válido');
        }

        const sql = `
            UPDATE usuarios 
            SET rol = ?, actualizado_en = NOW()
            WHERE id = ? AND id != ?
        `;
        
        try {
            const result = await query(sql, [newRole, employeeId, adminId]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al cambiar rol del barbero: ${error.message}`);
        }
    }
}

module.exports = User; 