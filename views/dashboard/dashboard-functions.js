// Dashboard Functions - Funcionalidades adicionales del dashboard

// Load appointments
async function loadAppointments() {
    try {
        const response = await fetch('/dashboard/appointments', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                renderAppointments(data.data, data.pagination);
            } else {
                showError('Error al cargar las citas');
            }
        } else {
            throw new Error(`Error del servidor: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        showError('Error al cargar las citas');
    }
}

// Render appointments
function renderAppointments(appointments, pagination) {
    const container = document.getElementById('appointmentsList');
    if (!container) return;

    if (!appointments || appointments.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-calendar-times fa-3x mb-3"></i>
                <p>No hay citas registradas</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appointments.map(appointment => {
        const date = formatDate(appointment.fecha);
        const time = formatTime(appointment.hora_inicio);
        const statusClass = getStatusClass(appointment.estado);
        const statusText = getStatusText(appointment.estado);
        
        return `
            <div class="appointment-item" data-id="${appointment.id}">
                <div class="appointment-time">
                    <div>${time}</div>
                    <small>${date}</small>
                </div>
                <div class="appointment-info">
                    <div class="appointment-client">
                        ${appointment.cliente_nombre} ${appointment.cliente_apellido}
                    </div>
                    <div class="appointment-service">
                        ${appointment.servicio_nombre} - ${formatPrice(appointment.precio_final || 0)}
                    </div>
                    <div class="appointment-phone">
                        <i class="fas fa-phone me-1"></i>${appointment.cliente_telefono}
                    </div>
                </div>
                <div class="appointment-actions">
                    <div class="appointment-status ${statusClass}">
                        ${statusText}
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewAppointment(${appointment.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="updateAppointmentStatus(${appointment.id}, 'completado')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAppointment(${appointment.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Render pagination
    renderPagination(container, pagination, loadAppointments);
}

// Load clients
async function loadClients() {
    try {
        const response = await fetch('/dashboard/clients', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                renderClients(data.data, data.pagination);
            } else {
                showError('Error al cargar los clientes');
            }
        } else {
            throw new Error(`Error del servidor: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading clients:', error);
        showError('Error al cargar los clientes');
    }
}

// Render clients
function renderClients(clients, pagination) {
    const container = document.getElementById('clientsList');
    if (!container) return;

    if (!clients || clients.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-users fa-3x mb-3"></i>
                <p>No hay clientes registrados</p>
            </div>
        `;
        return;
    }

    container.innerHTML = clients.map(client => {
        const totalGastado = Number(client.total_gastado) || 0;
        const ultimaCita = client.ultima_cita ? formatDate(client.ultima_cita) : 'Nunca';
        
        return `
            <div class="client-item" data-id="${client.id}">
                <div class="client-info">
                    <div class="client-name">
                        ${client.nombre} ${client.apellido}
                    </div>
                    <div class="client-contact">
                        <i class="fas fa-phone me-1"></i>${client.telefono}
                        ${client.email ? `<br><i class="fas fa-envelope me-1"></i>${client.email}` : ''}
                    </div>
                </div>
                <div class="client-stats">
                    <div class="stat">
                        <span class="stat-value">${client.total_citas || 0}</span>
                        <span class="stat-label">Citas</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${formatPrice(totalGastado)}</span>
                        <span class="stat-label">Total</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${ultimaCita}</span>
                        <span class="stat-label">Última visita</span>
                    </div>
                </div>
                <div class="client-actions">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewClient(${client.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="editClient(${client.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteClient(${client.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Render pagination
    renderPagination(container, pagination, loadClients);
}

// Load services
async function loadServices() {
    try {
        const response = await fetch('/dashboard/services', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                renderServices(data.data, data.pagination);
            } else {
                showError('Error al cargar los servicios');
            }
        } else {
            throw new Error(`Error del servidor: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading services:', error);
        showError('Error al cargar los servicios');
    }
}

// Render services
function renderServices(services, pagination) {
    const container = document.getElementById('servicesList');
    if (!container) return;

    if (!services || services.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-concierge-bell fa-3x mb-3"></i>
                <p>No hay servicios registrados</p>
            </div>
        `;
        return;
    }

    container.innerHTML = services.map(service => {
        const totalRecaudado = Number(service.total_recaudado) || 0;
        const reservasCompletadas = Number(service.reservas_completadas) || 0;
        
        return `
            <div class="service-item" data-id="${service.id}">
                <div class="service-info">
                    <div class="service-name">${service.nombre}</div>
                    <div class="service-description">${service.descripcion || 'Sin descripción'}</div>
                    <div class="service-price">
                        <span class="current-price">${formatPrice(service.precio || 0)}</span>
                        ${service.precio_anterior ? `<span class="old-price">${formatPrice(service.precio_anterior)}</span>` : ''}
                    </div>
                    <div class="service-duration">
                        <i class="fas fa-clock me-1"></i>${service.duracion} min
                    </div>
                </div>
                <div class="service-stats">
                    <div class="stat">
                        <span class="stat-value">${formatNumber(service.total_reservas || 0)}</span>
                        <span class="stat-label">Total</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${reservasCompletadas}</span>
                        <span class="stat-label">Completadas</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${formatPrice(totalRecaudado)}</span>
                        <span class="stat-label">Recaudado</span>
                    </div>
                </div>
                <div class="service-actions">
                    <div class="service-status ${service.estado === 'activo' ? 'active' : 'inactive'}">
                        ${service.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-warning" onclick="editService(${service.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteService(${service.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Render pagination
    renderPagination(container, pagination, loadServices);
}

// Render pagination
function renderPagination(container, pagination, loadFunction) {
    if (!pagination || pagination.pages <= 1) return;

    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container mt-3';
    
    let paginationHTML = '<nav><ul class="pagination justify-content-center">';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${pagination.page <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${pagination.page - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= pagination.pages; i++) {
        if (i === 1 || i === pagination.pages || (i >= pagination.page - 2 && i <= pagination.page + 2)) {
            paginationHTML += `
                <li class="page-item ${i === pagination.page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        } else if (i === pagination.page - 3 || i === pagination.page + 3) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${pagination.page >= pagination.pages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${pagination.page + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;

    paginationHTML += '</ul></nav>';
    paginationContainer.innerHTML = paginationHTML;
    container.appendChild(paginationContainer);
}

// Global functions for actions
window.viewAppointment = async function(id) {
    try {
        const response = await fetch(`/dashboard/appointments/${id}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showAppointmentModal(data.data);
            }
        }
    } catch (error) {
        console.error('Error viewing appointment:', error);
    }
};

window.updateAppointmentStatus = async function(id, status) {
    try {
        const response = await fetch(`/dashboard/appointments/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ estado: status })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                loadAppointments(); // Reload appointments
                showSuccess('Estado de cita actualizado');
            }
        }
    } catch (error) {
        console.error('Error updating appointment status:', error);
        showError('Error al actualizar el estado de la cita');
    }
};

window.deleteAppointment = async function(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cita?')) return;

    try {
        const response = await fetch(`/dashboard/appointments/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                loadAppointments(); // Reload appointments
                showSuccess('Cita eliminada exitosamente');
            }
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        showError('Error al eliminar la cita');
    }
};

window.viewClient = async function(id) {
    try {
        const response = await fetch(`/dashboard/clients/${id}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showClientModal(data.data);
            }
        }
    } catch (error) {
        console.error('Error viewing client:', error);
    }
};

window.editClient = function(id) {
    // TODO: Implement edit client modal
    console.log('Edit client:', id);
};

window.deleteClient = async function(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return;

    try {
        const response = await fetch(`/dashboard/clients/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                loadClients(); // Reload clients
                showSuccess('Cliente eliminado exitosamente');
            } else {
                showError(data.message);
            }
        }
    } catch (error) {
        console.error('Error deleting client:', error);
        showError('Error al eliminar el cliente');
    }
};

window.editService = function(id) {
    // TODO: Implement edit service modal
    console.log('Edit service:', id);
};

window.deleteService = async function(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) return;

    try {
        const response = await fetch(`/dashboard/services/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                loadServices(); // Reload services
                showSuccess('Servicio eliminado exitosamente');
            } else {
                showError(data.message);
            }
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        showError('Error al eliminar el servicio');
    }
};

window.changePage = function(page) {
    // TODO: Implement page change functionality
    console.log('Change page:', page);
};

// Utility functions
function showSuccess(message) {
    // TODO: Implement success notification
    console.log('Success:', message);
}

function showAppointmentModal(appointment) {
    // TODO: Implement appointment modal
    console.log('Show appointment modal:', appointment);
}

function showClientModal(client) {
    // TODO: Implement client modal
    console.log('Show client modal:', client);
}

// Export functions for use in main script
window.dashboardFunctions = {
    loadAppointments,
    loadClients,
    loadServices,
    renderAppointments,
    renderClients,
    renderServices
}; 