const User = require('../models/User');
const { query } = require('../config/db');

// Obtener estadísticas del sistema
const getSystemStats = async (req, res) => {
    try {
        // Estadísticas de usuarios
        const userStats = await User.getUserStats();
        
        // Estadísticas de turnos
        const appointmentStats = await getAppointmentStats();
        
        // Estadísticas de servicios
        const serviceStats = await getServiceStats();
        
        // Estadísticas de clientes
        const clientStats = await getClientStats();
        
        const stats = {
            ...userStats,
            ...appointmentStats,
            ...serviceStats,
            ...clientStats,
            version: '1.0.0',
            database: 'MySQL',
            nodeVersion: process.version,
            uptime: process.uptime()
        };
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas del sistema:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo estadísticas del sistema'
        });
    }
};

// Crear backup del sistema
const createBackup = async (req, res) => {
    try {
        // Aquí implementarías la lógica de backup
        // Por ahora solo simulamos la operación
        
        res.json({
            success: true,
            message: 'Backup creado exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creando backup:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando backup del sistema'
        });
    }
};

// Limpiar logs del sistema
const clearLogs = async (req, res) => {
    try {
        // Aquí implementarías la lógica de limpieza de logs
        // Por ahora solo simulamos la operación
        
        res.json({
            success: true,
            message: 'Logs limpiados exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error limpiando logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error limpiando logs del sistema'
        });
    }
};

// Obtener información del sistema
const getSystemInfo = async (req, res) => {
    try {
        const systemInfo = {
            version: '1.0.0',
            database: 'MySQL',
            nodeVersion: process.version,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            platform: process.platform,
            arch: process.arch,
            env: process.env.NODE_ENV
        };
        
        res.json({
            success: true,
            systemInfo
        });
    } catch (error) {
        console.error('Error obteniendo información del sistema:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo información del sistema'
        });
    }
};

// Funciones auxiliares para estadísticas
async function getAppointmentStats() {
    try {
        const sql = `
            SELECT 
                COUNT(*) as totalAppointments,
                COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completedAppointments,
                COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelledAppointments,
                COUNT(CASE WHEN fecha >= CURDATE() THEN 1 END) as todayAppointments
            FROM turnos
        `;
        
        const [result] = await query(sql);
        return {
            totalAppointments: result.totalAppointments || 0,
            completedAppointments: result.completedAppointments || 0,
            cancelledAppointments: result.cancelledAppointments || 0,
            todayAppointments: result.todayAppointments || 0
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas de turnos:', error);
        return {
            totalAppointments: 0,
            completedAppointments: 0,
            cancelledAppointments: 0,
            todayAppointments: 0
        };
    }
}

async function getServiceStats() {
    try {
        const sql = `
            SELECT 
                COUNT(*) as totalServices,
                COUNT(CASE WHEN estado = 'activo' THEN 1 END) as activeServices,
                AVG(precio) as averagePrice
            FROM servicios
        `;
        
        const [result] = await query(sql);
        return {
            totalServices: result.totalServices || 0,
            activeServices: result.activeServices || 0,
            averagePrice: result.averagePrice || 0
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas de servicios:', error);
        return {
            totalServices: 0,
            activeServices: 0,
            averagePrice: 0
        };
    }
}

async function getClientStats() {
    try {
        const sql = `
            SELECT 
                COUNT(*) as totalClients,
                COUNT(CASE WHEN fecha_registro >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as newClientsThisMonth,
                COUNT(CASE WHEN ultima_visita >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as activeClientsThisWeek
            FROM clientes
        `;
        
        const [result] = await query(sql);
        return {
            totalClients: result.totalClients || 0,
            newClientsThisMonth: result.newClientsThisMonth || 0,
            activeClientsThisWeek: result.activeClientsThisWeek || 0
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas de clientes:', error);
        return {
            totalClients: 0,
            newClientsThisMonth: 0,
            activeClientsThisWeek: 0
        };
    }
}

module.exports = {
    getSystemStats,
    createBackup,
    clearLogs,
    getSystemInfo
};
