const User = require('../models/User');

// Obtener lista de barberos
const getEmployees = async (req, res) => {
    try {
        const employees = await User.findEmployeesByAdmin(req.user.id);
        
        if (!res.headersSent) {
            res.json({
                success: true,
                employees
            });
        }
    } catch (error) {
        console.error('Error al obtener barberos:', error);
        if (!res.headersSent) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

// Cambiar estado de barbero
const toggleEmployeeStatus = async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        const success = await User.toggleEmployeeStatus(employeeId, req.user.id);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Barbero no encontrado'
            });
        }
        
        if (!res.headersSent) {
            res.json({
                success: true,
                message: 'Estado del barbero actualizado correctamente'
            });
        }
    } catch (error) {
        console.error('Error al cambiar estado del barbero:', error);
        if (!res.headersSent) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

// Cambiar rol de barbero
const changeEmployeeRole = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { newRole } = req.body;
        
        if (!newRole || !['admin', 'barbero'].includes(newRole)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido. Debe ser "admin" o "barbero"'
            });
        }
        
        const success = await User.changeEmployeeRole(employeeId, newRole, req.user.id);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Barbero no encontrado'
            });
        }
        
        if (!res.headersSent) {
            res.json({
                success: true,
                message: `Rol del barbero cambiado a ${newRole} correctamente`
            });
        }
    } catch (error) {
        console.error('Error al cambiar rol del barbero:', error);
        if (!res.headersSent) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

// Obtener estadísticas de barberos
const getEmployeeStats = async (req, res) => {
    try {
        const employees = await User.findEmployeesByAdmin(req.user.id);
        
        const stats = {
            total: employees.length,
            activos: employees.filter(emp => emp.estado === 'activo').length,
            inactivos: employees.filter(emp => emp.estado === 'inactivo').length,
            admins: employees.filter(emp => emp.rol === 'admin').length,
            barberos: employees.filter(emp => emp.rol === 'barbero').length
        };
        
        if (!res.headersSent) {
            res.json({
                success: true,
                stats
            });
        }
    } catch (error) {
        console.error('Error al obtener estadísticas de barberos:', error);
        if (!res.headersSent) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = {
    getEmployees,
    toggleEmployeeStatus,
    changeEmployeeRole,
    getEmployeeStats
};
