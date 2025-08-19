// Panel de Administración
class AdminPanel {
    constructor() {
        this.initializeEventListeners();
        this.loadAdminData();
    }

    initializeEventListeners() {
        // Botón de actualizar empleados
        document.getElementById('refreshEmployeesBtn')?.addEventListener('click', () => {
            this.loadEmployees();
        });

        // Botones de copiar códigos
        document.getElementById('copyBarberCode')?.addEventListener('click', () => {
            this.copyToClipboard('barberCode', 'Código de barbero copiado');
        });

        document.getElementById('copyAdminCode')?.addEventListener('click', () => {
            this.copyToClipboard('adminCode', 'Código de administrador copiado');
        });

        // Botones de acciones del sistema
        document.getElementById('backupSystemBtn')?.addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
            this.clearLogs();
        });

        document.getElementById('systemInfoBtn')?.addEventListener('click', () => {
            this.showSystemInfo();
        });
    }

    async loadAdminData() {
        try {
            // Cargar estadísticas de barberos
            await this.loadEmployeeStats();
            
            // Cargar lista de barberos
            await this.loadEmployees();
            
            // Cargar códigos de registro
            this.loadRegistrationCodes();
            
        } catch (error) {
            console.error('Error cargando datos de administración:', error);
            this.showToast('Error cargando datos de administración', 'error');
        }
    }

    async loadEmployeeStats() {
        try {
            const response = await fetch('/api/employees/stats', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateEmployeeStats(data);
            } else {
                throw new Error('Error al cargar estadísticas');
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            this.showToast('Error cargando estadísticas de barberos', 'error');
        }
    }

    updateEmployeeStats(stats) {
        document.getElementById('totalEmployees').textContent = stats.total || 0;
        document.getElementById('activeEmployees').textContent = stats.active || 0;
        document.getElementById('inactiveEmployees').textContent = stats.inactive || 0;
        document.getElementById('adminCount').textContent = stats.admins || 0;
    }

    async loadEmployees() {
        try {
            const response = await fetch('/api/employees', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderEmployeesTable(data.employees);
            } else {
                throw new Error('Error al cargar empleados');
            }
        } catch (error) {
            console.error('Error cargando empleados:', error);
            this.showToast('Error cargando lista de barberos', 'error');
        }
    }

    renderEmployeesTable(employees) {
        const tbody = document.getElementById('employeesTableBody');
        
        if (!employees || employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay barberos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = employees.map(employee => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm me-2">
                            <i class="fas fa-user-circle fa-2x text-muted"></i>
                        </div>
                        <div>
                            <strong>${employee.nombre} ${employee.apellido}</strong>
                        </div>
                    </div>
                </td>
                <td>${employee.email}</td>
                <td>${employee.nombre_barberia || 'N/A'}</td>
                <td>
                    <span class="badge ${employee.rol === 'admin' ? 'bg-danger' : 'bg-primary'}">
                        ${employee.rol === 'admin' ? 'Administrador' : 'Barbero'}
                    </span>
                </td>
                <td>
                    <span class="badge ${employee.estado === 'activo' ? 'bg-success' : 'bg-warning'}">
                        ${employee.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>${employee.ultimo_acceso ? new Date(employee.ultimo_acceso).toLocaleString() : 'Nunca'}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="adminPanel.toggleEmployeeStatus('${employee.id}')" title="Cambiar estado">
                            <i class="fas ${employee.estado === 'activo' ? 'fa-user-times' : 'fa-user-check'}"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="adminPanel.changeEmployeeRole('${employee.id}')" title="Cambiar rol">
                            <i class="fas fa-user-edit"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="adminPanel.viewEmployeeDetails('${employee.id}')" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async toggleEmployeeStatus(employeeId) {
        try {
            const response = await fetch(`/api/employees/${employeeId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

                    if (response.ok) {
            this.showToast('Estado del barbero actualizado', 'success');
            await this.loadEmployees();
            await this.loadEmployeeStats();
        } else {
            throw new Error('Error al actualizar estado');
        }
    } catch (error) {
        console.error('Error cambiando estado:', error);
        this.showToast('Error al cambiar estado del barbero', 'error');
    }
    }

    async changeEmployeeRole(employeeId) {
        const newRole = confirm('¿Cambiar rol del barbero?') ? 'admin' : 'barbero';
        
        try {
            const response = await fetch(`/api/employees/${employeeId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ role: newRole })
            });

                    if (response.ok) {
            this.showToast('Rol del barbero actualizado', 'success');
            await this.loadEmployees();
            await this.loadEmployeeStats();
        } else {
            throw new Error('Error al actualizar rol');
        }
    } catch (error) {
        console.error('Error cambiando rol:', error);
        this.showToast('Error al cambiar rol del barbero', 'error');
    }
    }

    viewEmployeeDetails(employeeId) {
        // Implementar modal con detalles del barbero
        this.showToast('Función en desarrollo', 'info');
    }

    loadRegistrationCodes() {
        // Los códigos se cargan desde el backend
        document.getElementById('barberCode').value = 'ALEXIS2024';
        document.getElementById('adminCode').value = 'ADMIN2024';
    }

    copyToClipboard(elementId, message) {
        const element = document.getElementById(elementId);
        element.select();
        element.setSelectionRange(0, 99999); // Para dispositivos móviles
        
        try {
            document.execCommand('copy');
            this.showToast(message, 'success');
        } catch (err) {
            console.error('Error copiando al portapapeles:', err);
            this.showToast('Error al copiar código', 'error');
        }
    }

    async createBackup() {
        try {
            this.showToast('Creando backup del sistema...', 'info');
            
            const response = await fetch('/api/admin/backup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.showToast('Backup creado exitosamente', 'success');
            } else {
                throw new Error('Error creando backup');
            }
        } catch (error) {
            console.error('Error creando backup:', error);
            this.showToast('Error al crear backup', 'error');
        }
    }

    async clearLogs() {
        if (!confirm('¿Estás seguro de que quieres limpiar los logs del sistema?')) {
            return;
        }

        try {
            this.showToast('Limpiando logs...', 'info');
            
            const response = await fetch('/api/admin/clear-logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.showToast('Logs limpiados exitosamente', 'success');
            } else {
                throw new Error('Error limpiando logs');
            }
        } catch (error) {
            console.error('Error limpiando logs:', error);
            this.showToast('Error al limpiar logs', 'error');
        }
    }

    async showSystemInfo() {
        try {
            const response = await fetch('/api/admin/system-info', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displaySystemInfo(data);
            } else {
                throw new Error('Error obteniendo información del sistema');
            }
        } catch (error) {
            console.error('Error obteniendo información del sistema:', error);
            this.showToast('Error al obtener información del sistema', 'error');
        }
    }

    displaySystemInfo(info) {
        const infoHtml = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Información del Sistema</h6>
                    <ul class="list-unstyled">
                        <li><strong>Versión:</strong> ${info.version || '1.0.0'}</li>
                        <li><strong>Base de Datos:</strong> ${info.database || 'MySQL'}</li>
                        <li><strong>Node.js:</strong> ${info.nodeVersion || 'N/A'}</li>
                        <li><strong>Uptime:</strong> ${info.uptime || 'N/A'}</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h6>Estadísticas</h6>
                    <ul class="list-unstyled">
                        <li><strong>Usuarios:</strong> ${info.totalUsers || 0}</li>
                        <li><strong>Turnos:</strong> ${info.totalAppointments || 0}</li>
                        <li><strong>Servicios:</strong> ${info.totalServices || 0}</li>
                        <li><strong>Clientes:</strong> ${info.totalClients || 0}</li>
                    </ul>
                </div>
            </div>
        `;

        // Mostrar en modal
        const modal = new bootstrap.Modal(document.getElementById('systemInfoModal'));
        document.getElementById('systemInfoModalBody').innerHTML = infoHtml;
        modal.show();
    }

    showToast(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        const toastId = 'toast-' + Date.now();
        
        const toastHtml = `
            <div id="${toastId}" class="toast" role="alert">
                <div class="toast-header">
                    <i class="fas fa-info-circle text-${type} me-2"></i>
                    <strong class="me-auto">Administración</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        const toast = new bootstrap.Toast(document.getElementById(toastId));
        toast.show();
        
        // Remover el toast después de que se oculte
        document.getElementById(toastId).addEventListener('hidden.bs.toast', function() {
            this.remove();
        });
    }
}

// Inicializar el panel de administración cuando se carga la página
let adminPanel;

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario es admin desde localStorage (fallback)
    const userRole = localStorage.getItem('userRole');
    
    if (userRole === 'admin') {
        // Solo mostrar el enlace de navegación de administración
        const adminNavItem = document.querySelector('.nav-item.admin-only');
        if (adminNavItem) {
            adminNavItem.style.display = 'block';
        }
    }
});

// Hacer la clase AdminPanel disponible globalmente
window.AdminPanel = AdminPanel;
