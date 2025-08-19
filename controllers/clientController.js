const Client = require('../models/Client');
const { validationResult } = require('express-validator');

class ClientController {
    /**
     * Obtener todos los clientes del barbero
     */
    static async getClients(req, res) {
        try {
            const { page = 1, limit = 20, search = '' } = req.query;
            const offset = (page - 1) * limit;
            const userId = req.user.id;

            let clients;
            let total;

            if (search) {
                // Buscar clientes por nombre
                clients = await Client.searchByName(userId, search, parseInt(limit));
                total = clients.length;
            } else {
                // Obtener todos los clientes con paginación
                clients = await Client.findByBarber(userId, parseInt(limit), offset);
                
                // Obtener total de clientes para paginación
                const totalResult = await Client.findByBarber(userId, 1000, 0);
                total = totalResult.length;
            }

            res.json({
                success: true,
                data: {
                    clients,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los clientes'
            });
        }
    }

    /**
     * Obtener un cliente específico
     */
    static async getClient(req, res) {
        try {
            const { id } = req.params;
            const client = await Client.findById(id);

            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            // Obtener historial de citas del cliente
            const appointmentHistory = await Client.getAppointmentHistory(id, req.user.id);

            res.json({
                success: true,
                data: {
                    client,
                    appointmentHistory
                }
            });
        } catch (error) {
            console.error('Error al obtener cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el cliente'
            });
        }
    }

    /**
     * Crear un nuevo cliente
     */
    static async createClient(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: errors.array()
                });
            }

            const {
                nombre,
                apellido,
                email,
                telefono,
                fecha_nacimiento,
                notas
            } = req.body;

            // Verificar si ya existe un cliente con el mismo teléfono
            const existingClient = await Client.findByPhone(telefono);
            if (existingClient) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un cliente con este teléfono'
                });
            }

            // Verificar si ya existe un cliente con el mismo email (si se proporciona)
            if (email) {
                const existingByEmail = await Client.findByEmail(email);
                if (existingByEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un cliente con este email'
                    });
                }
            }

            const clientData = {
                nombre,
                apellido,
                email: email || null,
                telefono,
                fecha_nacimiento: fecha_nacimiento || null,
                notas: notas || null
            };

            const newClient = await Client.create(clientData);

            res.status(201).json({
                success: true,
                message: 'Cliente creado exitosamente',
                data: newClient
            });
        } catch (error) {
            console.error('Error al crear cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear el cliente'
            });
        }
    }

    /**
     * Actualizar un cliente
     */
    static async updateClient(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const {
                nombre,
                apellido,
                email,
                telefono,
                fecha_nacimiento,
                notas
            } = req.body;

            // Verificar que el cliente existe
            const existingClient = await Client.findById(id);
            if (!existingClient) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            // Verificar si el teléfono ya está en uso por otro cliente
            if (telefono !== existingClient.telefono) {
                const clientWithPhone = await Client.findByPhone(telefono);
                if (clientWithPhone && clientWithPhone.id !== parseInt(id)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un cliente con este teléfono'
                    });
                }
            }

            // Verificar si el email ya está en uso por otro cliente
            if (email && email !== existingClient.email) {
                const clientWithEmail = await Client.findByEmail(email);
                if (clientWithEmail && clientWithEmail.id !== parseInt(id)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un cliente con este email'
                    });
                }
            }

            const updateData = {
                nombre,
                apellido,
                email: email || null,
                telefono,
                fecha_nacimiento: fecha_nacimiento || null,
                notas: notas || null
            };

            const updated = await Client.update(id, updateData);

            if (!updated) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al actualizar el cliente'
                });
            }

            // Obtener el cliente actualizado
            const updatedClient = await Client.findById(id);

            res.json({
                success: true,
                message: 'Cliente actualizado exitosamente',
                data: updatedClient
            });
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el cliente'
            });
        }
    }

    /**
     * Eliminar un cliente
     */
    static async deleteClient(req, res) {
        try {
            const { id } = req.params;

            // Verificar que el cliente existe
            const existingClient = await Client.findById(id);
            if (!existingClient) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            // Verificar si el cliente tiene citas futuras
            const appointmentHistory = await Client.getAppointmentHistory(id, req.user.id);
            const hasFutureAppointments = appointmentHistory.some(app => 
                new Date(app.fecha) > new Date() && app.estado !== 'cancelado'
            );

            if (hasFutureAppointments) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede eliminar un cliente con citas futuras'
                });
            }

            const deleted = await Client.delete(id);

            if (!deleted) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al eliminar el cliente'
                });
            }

            res.json({
                success: true,
                message: 'Cliente eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el cliente'
            });
        }
    }

    /**
     * Buscar clientes
     */
    static async searchClients(req, res) {
        try {
            const { q, limit = 20 } = req.query;
            const userId = req.user.id;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'El término de búsqueda debe tener al menos 2 caracteres'
                });
            }

            const clients = await Client.searchByName(userId, q.trim(), parseInt(limit));

            res.json({
                success: true,
                data: clients
            });
        } catch (error) {
            console.error('Error al buscar clientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar clientes'
            });
        }
    }

    /**
     * Obtener estadísticas de clientes
     */
    static async getClientStats(req, res) {
        try {
            const userId = req.user.id;
            const stats = await Client.getStats(userId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error al obtener estadísticas de clientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas de clientes'
            });
        }
    }

    /**
     * Obtener clientes frecuentes
     */
    static async getFrequentClients(req, res) {
        try {
            const { limit = 10 } = req.query;
            const userId = req.user.id;

            const clients = await Client.getFrequentClients(userId, parseInt(limit));

            res.json({
                success: true,
                data: clients
            });
        } catch (error) {
            console.error('Error al obtener clientes frecuentes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener clientes frecuentes'
            });
        }
    }

    /**
     * Obtener nuevos clientes
     */
    static async getNewClients(req, res) {
        try {
            const { limit = 10 } = req.query;
            const userId = req.user.id;

            const clients = await Client.getNewClients(userId, parseInt(limit));

            res.json({
                success: true,
                data: clients
            });
        } catch (error) {
            console.error('Error al obtener nuevos clientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener nuevos clientes'
            });
        }
    }
}

module.exports = ClientController; 