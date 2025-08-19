// Gestión de Turnos - Integrada en Dashboard
class TurnosManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentFilters = {};
        this.turnos = [];
        this.clientes = [];
        this.servicios = [];
        this.editingCita = null;
        this.confirmCallback = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        await this.loadTurnos();
        this.updateStats();
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('btnNuevaCita')?.addEventListener('click', () => this.openModal());
        document.getElementById('btnRefresh')?.addEventListener('click', () => this.loadTurnos());
        document.getElementById('btnExportar')?.addEventListener('click', () => this.exportarCitas());
        document.getElementById('btnLimpiarFiltros')?.addEventListener('click', () => this.limpiarFiltros());

        // Filtros
        document.getElementById('filterEstado')?.addEventListener('change', (e) => {
            this.currentFilters.estado = e.target.value;
            this.currentPage = 1;
            this.loadTurnos();
        });

        document.getElementById('filterFecha')?.addEventListener('change', (e) => {
            this.currentFilters.fecha = e.target.value;
            this.currentPage = 1;
            this.loadTurnos();
        });

        document.getElementById('searchCliente')?.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value;
            this.currentPage = 1;
            this.debounce(() => this.loadTurnos(), 300);
        });

        // Modal
        document.getElementById('btnGuardarCita')?.addEventListener('click', () => this.guardarCita());

        // Modal de confirmación
        document.getElementById('btnConfirmarAccion')?.addEventListener('click', () => this.confirmarAccion());

        // Formulario
        document.getElementById('servicioSelect')?.addEventListener('change', (e) => this.onServicioChange(e));
        
        // Cargar slots cuando cambie la fecha
        document.getElementById('fechaCita')?.addEventListener('change', (e) => this.loadAvailableSlots(e.target.value));
        
        // Cargar slots cuando cambie el servicio
        document.getElementById('servicioSelect')?.addEventListener('change', (e) => {
            this.onServicioChange(e);
            const fecha = document.getElementById('fechaCita').value;
            if (fecha) {
                this.loadAvailableSlots(fecha);
            }
        });

        // Auto-Completado
        document.getElementById('btnAutoComplete')?.addEventListener('click', () => this.runAutoComplete());
        this.setupAutoCompleteSystem();
    }

    async loadInitialData() {
        try {
            this.showLoading(true);
            
            // Cargar clientes y servicios en paralelo
            const [clientesRes, serviciosRes] = await Promise.all([
                fetch('/dashboard/clients'),
                fetch('/dashboard/services')
            ]);

            if (clientesRes.ok) {
                const clientesData = await clientesRes.json();
                this.clientes = clientesData.data || [];
                this.populateClientesSelect();
            }

            if (serviciosRes.ok) {
                const serviciosData = await serviciosRes.json();
                this.servicios = serviciosData.data || [];
                this.populateServiciosSelect();
            }
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            this.showNotification('Error cargando datos iniciales', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadTurnos() {
        try {
            this.showLoading(true);
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.currentFilters
            });

            const response = await fetch(`/dashboard/appointments?${params}`);
            
            if (response.ok) {
                const data = await response.json();
                this.turnos = data.data || [];
                this.renderTurnosTable();
                this.renderPagination(data.pagination);
                this.updateStats();
            } else {
                throw new Error('Error cargando citas');
            }
        } catch (error) {
            console.error('Error cargando citas:', error);
            this.showNotification('Error cargando citas', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderTurnosTable() {
        const tbody = document.getElementById('turnosTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (this.turnos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <p class="text-muted">No se encontraron citas</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.turnos.forEach(cita => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div>
                        <strong>${cita.cliente_nombre} ${cita.cliente_apellido}</strong>
                        <br>
                        <small class="text-muted">${cita.cliente_telefono}</small>
                    </div>
                </td>
                <td>
                    <div>
                        <strong>${cita.servicio_nombre}</strong>
                        <br>
                        <small class="text-muted">${formatPrice(cita.servicio_precio)}</small>
                    </div>
                </td>
                <td>${this.formatDate(cita.fecha)}</td>
                <td>${this.formatTime(cita.hora_inicio)}</td>
                <td>
                    <span class="badge ${this.getEstadoBadgeClass(cita.estado)}">
                        ${this.getEstadoText(cita.estado)}
                    </span>
                </td>
                <td>${formatPrice(cita.precio_final || 0)}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        ${cita.estado === 'reservado' ? `
                            <button class="btn btn-outline-success" onclick="turnosManager.confirmarTurno(${cita.id})" title="Confirmar turno">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${cita.estado === 'confirmado' || cita.estado === 'en_proceso' ? `
                            <button class="btn btn-outline-primary" onclick="turnosManager.completarTurno(${cita.id})" title="Marcar como completado">
                                <i class="fas fa-flag-checkered"></i>
                            </button>
                        ` : ''}
                        ${cita.estado !== 'cancelado' && cita.estado !== 'completado' ? `
                            <button class="btn btn-outline-danger" onclick="turnosManager.cancelarTurno(${cita.id})" title="Cancelar turno">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-outline-info" onclick="turnosManager.verTurno(${cita.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderPagination(pagination) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer || !pagination || pagination.pages <= 1) return;
        
        paginationContainer.innerHTML = '';

        // Botón anterior
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-outline-primary me-2';
        prevBtn.textContent = 'Anterior';
        prevBtn.disabled = pagination.page <= 1;
        prevBtn.addEventListener('click', () => {
            if (pagination.page > 1) {
                this.currentPage = pagination.page - 1;
                this.loadTurnos();
            }
        });
        paginationContainer.appendChild(prevBtn);

        // Números de página
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `btn me-2 ${i === pagination.page ? 'btn-primary' : 'btn-outline-primary'}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.loadTurnos();
            });
            paginationContainer.appendChild(pageBtn);
        }

        // Botón siguiente
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-outline-primary';
        nextBtn.textContent = 'Siguiente';
        nextBtn.disabled = pagination.page >= pagination.pages;
        nextBtn.addEventListener('click', () => {
            if (pagination.page < pagination.pages) {
                this.currentPage = pagination.page + 1;
                this.loadTurnos();
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    updateStats() {
        const stats = {
            reservado: 0,
            confirmado: 0,
            completado: 0,
            cancelado: 0
        };

        this.turnos.forEach(cita => {
            if (stats.hasOwnProperty(cita.estado)) {
                stats[cita.estado]++;
            }
        });

        const totalReservadas = document.getElementById('totalReservadas');
        const totalConfirmadas = document.getElementById('totalConfirmadas');
        const totalCompletadas = document.getElementById('totalCompletadas');
        const totalCanceladas = document.getElementById('totalCanceladas');

        if (totalReservadas) totalReservadas.textContent = stats.reservado;
        if (totalConfirmadas) totalConfirmadas.textContent = stats.confirmado;
        if (totalCompletadas) totalCompletadas.textContent = stats.completado;
        if (totalCanceladas) totalCanceladas.textContent = stats.cancelado;
    }

    openModal(cita = null) {
        this.editingCita = cita;
        const modal = new bootstrap.Modal(document.getElementById('modalCita'));
        const title = document.getElementById('modalTitle');
        
        title.textContent = cita ? 'Editar Cita' : 'Nueva Cita';
        
        if (cita) {
            this.populateForm(cita);
        } else {
            this.clearForm();
        }
        
        modal.show();
    }

    populateForm(cita) {
        document.getElementById('clienteSelect').value = cita.cliente_id;
        document.getElementById('servicioSelect').value = cita.servicio_id;
        document.getElementById('fechaCita').value = cita.fecha;
        document.getElementById('estadoCita').value = cita.estado;
        document.getElementById('precioCita').value = cita.precio_final || '';
        document.getElementById('notasCita').value = cita.notas || '';
        
        // Cargar slots disponibles para la fecha y servicio
        this.loadAvailableSlots(cita.fecha).then(() => {
            // Después de cargar los slots, seleccionar la hora del turno
            const horaSelect = document.getElementById('horaCita');
            if (horaSelect) {
                horaSelect.value = cita.hora_inicio;
            }
        });
    }

    clearForm() {
        document.getElementById('formCita').reset();
        document.getElementById('precioCita').value = '';
        document.getElementById('notasCita').value = '';
        
        // Limpiar slots
        const horaSelect = document.getElementById('horaCita');
        const slotsMessage = document.getElementById('slotsMessage');
        if (horaSelect) {
            horaSelect.innerHTML = '<option value="">Selecciona una fecha primero...</option>';
        }
        if (slotsMessage) {
            slotsMessage.textContent = '';
        }
    }

    populateClientesSelect() {
        const select = document.getElementById('clienteSelect');
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleccionar cliente...</option>';
        
        this.clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = `${cliente.nombre} ${cliente.apellido} - ${cliente.telefono}`;
            select.appendChild(option);
        });
    }

    populateServiciosSelect() {
        const select = document.getElementById('servicioSelect');
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleccionar servicio...</option>';
        
        this.servicios.forEach(servicio => {
            const option = document.createElement('option');
            option.value = servicio.id;
            option.textContent = `${servicio.nombre} - ${formatPrice(servicio.precio)}`;
            option.dataset.precio = servicio.precio;
            select.appendChild(option);
        });
    }

    onServicioChange(e) {
        const servicioId = e.target.value;
        const precioInput = document.getElementById('precioCita');
        
        if (servicioId) {
            const servicio = this.servicios.find(s => s.id == servicioId);
            if (servicio) {
                precioInput.value = servicio.precio;
            }
        } else {
            precioInput.value = '';
        }
    }

    async guardarCita() {
        const form = document.getElementById('formCita');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = {
            cliente_id: document.getElementById('clienteSelect').value,
            servicio_id: document.getElementById('servicioSelect').value,
            fecha: document.getElementById('fechaCita').value,
            hora_inicio: document.getElementById('horaCita').value,
            estado: document.getElementById('estadoCita').value,
            precio_final: document.getElementById('precioCita').value,
            notas: document.getElementById('notasCita').value
        };

        try {
            this.showLoading(true);
            
            const url = this.editingCita 
                ? `/dashboard/appointments/${this.editingCita.id}` 
                : '/dashboard/appointments';
            
            const method = this.editingCita ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification(result.message, 'success');
                bootstrap.Modal.getInstance(document.getElementById('modalCita')).hide();
                await this.loadCitas();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error guardando cita');
            }
        } catch (error) {
            console.error('Error guardando cita:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async verTurno(id) {
        try {
            this.showLoading(true);
            
            const response = await fetch(`/dashboard/appointments/${id}`);
            
            if (response.ok) {
                const data = await response.json();
                this.mostrarDetallesTurno(data.data);
            } else {
                throw new Error('Error cargando detalles del turno');
            }
        } catch (error) {
            console.error('Error cargando turno:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    mostrarDetallesTurno(cita) {
        const modal = new bootstrap.Modal(document.getElementById('modalCita'));
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('formCita');
        
        title.textContent = 'Detalles del Turno';
        form.style.pointerEvents = 'none';
        
        this.populateForm(cita);
        modal.show();
        
        // Cambiar botones
        const btnGuardar = document.getElementById('btnGuardarCita');
        btnGuardar.textContent = 'Cerrar';
        btnGuardar.onclick = () => {
            modal.hide();
            form.style.pointerEvents = 'auto';
            btnGuardar.textContent = 'Guardar Turno';
            btnGuardar.onclick = () => this.guardarCita();
        };
    }

    async confirmarTurno(id) {
        this.showConfirmModal(
            '¿Estás seguro de que quieres confirmar este turno?',
            () => this.ejecutarConfirmarTurno(id)
        );
    }

    async ejecutarConfirmarTurno(id) {
        try {
            this.showLoading(true);
            
            const response = await fetch(`/dashboard/appointments/${id}/confirm`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'confirmado' })
            });

            if (response.ok) {
                this.showNotification('Turno confirmado exitosamente', 'success');
                await this.loadTurnos();
                this.updateStats();
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Error al confirmar el turno', 'error');
            }
        } catch (error) {
            console.error('Error al confirmar turno:', error);
            this.showNotification('Error al confirmar el turno', 'error');
        } finally {
            this.showLoading(false);
            bootstrap.Modal.getInstance(document.getElementById('modalConfirmacion')).hide();
        }
    }

    async cancelarTurno(id) {
        this.showConfirmModal(
            '¿Estás seguro de que quieres cancelar este turno?',
            () => this.ejecutarCancelarTurno(id)
        );
    }

    async ejecutarCancelarTurno(id) {
        try {
            this.showLoading(true);
            
            const response = await fetch(`/dashboard/appointments/${id}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'cancelado' })
            });

            if (response.ok) {
                this.showNotification('Turno cancelado exitosamente', 'success');
                await this.loadTurnos();
                this.updateStats();
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Error al cancelar el turno', 'error');
            }
        } catch (error) {
            console.error('Error al cancelar turno:', error);
            this.showNotification('Error al cancelar el turno', 'error');
        } finally {
            this.showLoading(false);
            bootstrap.Modal.getInstance(document.getElementById('modalConfirmacion')).hide();
        }
    }

    async completarTurno(id) {
        this.showConfirmModal(
            '¿Estás seguro de que quieres marcar este turno como completado?',
            () => this.ejecutarCompletarTurno(id)
        );
    }

    async ejecutarCompletarTurno(id) {
        try {
            this.showLoading(true);
            
            const response = await fetch(`/dashboard/appointments/${id}/complete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'completado' })
            });

            if (response.ok) {
                this.showNotification('Turno marcado como completado exitosamente', 'success');
                await this.loadTurnos();
                this.updateStats();
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Error al completar el turno', 'error');
            }
        } catch (error) {
            console.error('Error al completar turno:', error);
            this.showNotification('Error al completar el turno', 'error');
        } finally {
            this.showLoading(false);
            bootstrap.Modal.getInstance(document.getElementById('modalConfirmacion')).hide();
        }
    }

    async confirmarEliminarCita(id) {
        try {
            this.showLoading(true);
            
            const response = await fetch(`/dashboard/appointments/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification(result.message, 'success');
                await this.loadCitas();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error eliminando cita');
            }
        } catch (error) {
            console.error('Error eliminando cita:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.showLoading(false);
            bootstrap.Modal.getInstance(document.getElementById('modalConfirmacion')).hide();
        }
    }

    limpiarFiltros() {
        this.currentFilters = {};
        this.currentPage = 1;
        
        document.getElementById('filterEstado').value = '';
        document.getElementById('filterFecha').value = '';
        document.getElementById('searchCliente').value = '';
        
        this.loadTurnos();
    }

    async exportarCitas() {
        try {
            this.showLoading(true);
            
            const params = new URLSearchParams({
                ...this.currentFilters,
                export: 'true'
            });

            const response = await fetch(`/dashboard/appointments?${params}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `citas_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                throw new Error('Error exportando citas');
            }
        } catch (error) {
            console.error('Error exportando citas:', error);
            this.showNotification('Error exportando citas', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Utilidades
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(timeString) {
        return timeString.substring(0, 5);
    }

    getEstadoText(estado) {
        const estados = {
            'reservado': 'Reservado',
            'confirmado': 'Confirmado',
            'en_proceso': 'En Proceso',
            'completado': 'Completado',
            'cancelado': 'Cancelado',
            'no_show': 'No Show'
        };
        return estados[estado] || estado;
    }

    getEstadoBadgeClass(estado) {
        const classes = {
            'reservado': 'bg-primary',
            'confirmado': 'bg-success',
            'en_proceso': 'bg-warning',
            'completado': 'bg-info',
            'cancelado': 'bg-danger',
            'no_show': 'bg-secondary'
        };
        return classes[estado] || 'bg-secondary';
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 3000;
            min-width: 300px;
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    showConfirmModal(message, onConfirm) {
        const modal = new bootstrap.Modal(document.getElementById('modalConfirmacion'));
        const mensaje = document.getElementById('mensajeConfirmacion');
        
        mensaje.textContent = message;
        this.confirmCallback = onConfirm;
        
        modal.show();
    }

    confirmarAccion() {
        if (this.confirmCallback) {
            this.confirmCallback();
        }
    }

    debounce(func, wait) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(func, wait);
    }

    async loadAvailableSlots(fecha) {
        const horaSelect = document.getElementById('horaCita');
        const slotsMessage = document.getElementById('slotsMessage');
        const servicioId = document.getElementById('servicioSelect').value;

        if (!fecha) {
            horaSelect.innerHTML = '<option value="">Selecciona una fecha primero...</option>';
            slotsMessage.textContent = '';
            return;
        }

        try {
            // Mostrar loading
            horaSelect.innerHTML = '<option value="">Cargando horarios...</option>';
            slotsMessage.textContent = '';

            const params = new URLSearchParams({ fecha });
            if (servicioId) {
                params.append('servicio_id', servicioId);
            }

            // Si estamos editando un turno, excluirlo de los conflictos
            if (this.editingCita && this.editingCita.id) {
                params.append('exclude_id', this.editingCita.id);
            }

            const response = await fetch(`/api/booking/slots?${params}`);
            const result = await response.json();

            if (result.success) {
                if (result.data.length > 0) {
                    // Limpiar opciones existentes
                    horaSelect.innerHTML = '<option value="">Selecciona hora</option>';
                    
                    result.data.forEach(slot => {
                        const option = document.createElement('option');
                        option.value = slot.hora_inicio;
                        option.textContent = slot.hora_inicio;
                        option.setAttribute('data-end-time', slot.hora_fin);
                        horaSelect.appendChild(option);
                    });
                    
                    slotsMessage.textContent = `${result.data.length} horarios disponibles`;
                    slotsMessage.className = 'form-text mt-1 text-success';
                } else {
                    horaSelect.innerHTML = '<option value="">No hay horarios disponibles</option>';
                    slotsMessage.textContent = result.message || 'No hay horarios disponibles para esta fecha';
                    slotsMessage.className = 'form-text mt-1 text-warning';
                }
            } else {
                horaSelect.innerHTML = '<option value="">Error al cargar horarios</option>';
                slotsMessage.textContent = 'Error al cargar horarios disponibles';
                slotsMessage.className = 'form-text mt-1 text-danger';
            }
        } catch (error) {
            console.error('Error al cargar horarios:', error);
            horaSelect.innerHTML = '<option value="">Error al cargar horarios</option>';
            slotsMessage.textContent = 'Error al cargar horarios disponibles';
            slotsMessage.className = 'form-text mt-1 text-danger';
        }
    }

    // ===== SISTEMA DE AUTO-COMPLETADO =====
    
    setupAutoCompleteSystem() {
        console.log('🔧 Configurando sistema de auto-completado...');
        this.updateAutoCompleteStats();
        this.startAutoCompleteTimer();
    }

    async updateAutoCompleteStats() {
        try {
            const response = await fetch('/api/appointments/auto-complete/stats');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.updateAutoCompleteUI(data.data);
                }
            }
        } catch (error) {
            console.error('Error actualizando estadísticas de auto-completado:', error);
        }
    }

    updateAutoCompleteUI(stats) {
        // Actualizar contadores
        const pendingElement = document.getElementById('pendingAutoComplete');
        const autoCompletedElement = document.getElementById('autoCompletedToday');
        const lastExecutionElement = document.getElementById('lastExecution');
        const nextExecutionElement = document.getElementById('nextExecution');

        if (pendingElement) pendingElement.textContent = stats.pendingCount || 0;
        if (autoCompletedElement) autoCompletedElement.textContent = stats.autoCompletedToday || 0;
        
        if (lastExecutionElement) {
            lastExecutionElement.textContent = stats.lastExecution ? 
                new Date(stats.lastExecution).toLocaleTimeString('es-AR') : '--';
        }
        
        if (nextExecutionElement) {
            nextExecutionElement.textContent = stats.nextExecution ? 
                new Date(stats.nextExecution).toLocaleTimeString('es-AR') : '--';
        }

        // Mostrar/ocultar sección de turnos pendientes
        const pendingSection = document.getElementById('pendingAppointmentsSection');
        if (pendingSection) {
            pendingSection.style.display = stats.pendingCount > 0 ? 'block' : 'none';
        }

        // Cargar turnos pendientes si hay
        if (stats.pendingCount > 0) {
            this.loadPendingAppointments();
        }
    }

    async loadPendingAppointments() {
        try {
            const response = await fetch('/api/appointments/auto-complete/pending');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayPendingAppointments(data.data);
                }
            }
        } catch (error) {
            console.error('Error cargando turnos pendientes:', error);
        }
    }

    displayPendingAppointments(appointments) {
        const tbody = document.getElementById('pendingAppointmentsBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        if (appointments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No hay turnos pendientes de auto-completado
                    </td>
                </tr>
            `;
            return;
        }

        appointments.forEach(appointment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${appointment.cliente_nombre} ${appointment.cliente_apellido}</td>
                <td>${appointment.servicio_nombre}</td>
                <td>${this.formatDate(appointment.fecha)}</td>
                <td>${appointment.hora_fin}</td>
                <td>
                    <span class="badge bg-warning">${appointment.estado}</span>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async runAutoComplete() {
        const button = document.getElementById('btnAutoComplete');
        if (!button) return;

        try {
            // Deshabilitar botón y mostrar loading
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Ejecutando...';

            const response = await fetch('/api/appointments/auto-complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(
                    `✅ Auto-completado ejecutado: ${result.data.updatedCount} turnos marcados como completados`, 
                    'success'
                );
                
                // Actualizar estadísticas y lista de turnos
                await this.updateAutoCompleteStats();
                await this.loadTurnos();
                this.updateStats();
            } else {
                this.showNotification(
                    `❌ Error en auto-completado: ${result.message}`, 
                    'error'
                );
            }
        } catch (error) {
            console.error('Error ejecutando auto-completado:', error);
            this.showNotification('❌ Error ejecutando auto-completado', 'error');
        } finally {
            // Restaurar botón
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-robot me-2"></i>Ejecutar Auto-Completado';
        }
    }

    startAutoCompleteTimer() {
        // Actualizar estadísticas cada 30 segundos
        setInterval(() => {
            this.updateAutoCompleteStats();
        }, 30000);
    }

    formatDate(dateString) {
        if (!dateString) return '--';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR');
    }
}

// Inicializar cuando el DOM esté listo y solo si estamos en la sección de turnos
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si estamos en la sección de turnos
    const turnosSection = document.getElementById('turnos');
    if (turnosSection && turnosSection.classList.contains('active')) {
        window.turnosManager = new TurnosManager();
    }
});

// Inicializar cuando se cambie a la sección de turnos
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('[data-section="turnos"]');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Inicializar después de un pequeño delay para asegurar que la sección esté visible
            setTimeout(() => {
                if (!window.turnosManager) {
                    window.turnosManager = new TurnosManager();
                }
            }, 100);
        });
    });
}); 