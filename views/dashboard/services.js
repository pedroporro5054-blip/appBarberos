// Gestión de Servicios - Integrada en Dashboard
class ServicesManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentFilters = {};
        this.servicios = [];
        this.editingService = null;
        this.confirmCallback = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadServices();
        this.updateStats();
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('btnNuevoServicio')?.addEventListener('click', () => this.openModal());
        document.getElementById('btnRefreshServices')?.addEventListener('click', () => this.loadServices());
        document.getElementById('btnExportarServices')?.addEventListener('click', () => this.exportarServicios());
        document.getElementById('btnLimpiarFiltrosServices')?.addEventListener('click', () => this.limpiarFiltros());

        // Filtros
        document.getElementById('filterServiceEstado')?.addEventListener('change', (e) => {
            this.currentFilters.estado = e.target.value;
            this.currentPage = 1;
            this.loadServices();
        });

        document.getElementById('searchService')?.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value;
            this.currentPage = 1;
            this.debounce(() => this.loadServices(), 300);
        });

        document.getElementById('filterServicePrice')?.addEventListener('change', (e) => {
            this.currentFilters.priceRange = e.target.value;
            this.currentPage = 1;
            this.loadServices();
        });

        // Modal
        document.getElementById('saveServiceBtn')?.addEventListener('click', () => this.guardarServicio());

        // Modal de confirmación
        document.getElementById('btnConfirmarAccion')?.addEventListener('click', () => this.confirmarAccion());

        // Contador de caracteres
        document.getElementById('serviceDescripcion')?.addEventListener('input', (e) => {
            const count = e.target.value.length;
            document.getElementById('serviceDescripcionCount').textContent = count;
        });

        // Modal de vista
        document.getElementById('editServiceBtn')?.addEventListener('click', () => {
            const serviceModal = new bootstrap.Modal(document.getElementById('serviceModal'));
            const viewServiceModal = bootstrap.Modal.getInstance(document.getElementById('viewServiceModal'));
            viewServiceModal.hide();
            serviceModal.show();
        });
    }

    async loadServices() {
        try {
            this.showLoading(true);
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.currentFilters
            });

            const response = await fetch(`/dashboard/services?${params}`);
            
            if (response.ok) {
                const data = await response.json();
                this.servicios = data.data || [];
                this.renderServicesTable();
                this.renderPagination(data.pagination);
                this.updateStats();
            } else {
                throw new Error('Error cargando servicios');
            }
        } catch (error) {
            console.error('Error cargando servicios:', error);
            this.showNotification('Error cargando servicios', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderServicesTable() {
        const tbody = document.getElementById('serviciosTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (this.servicios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <p class="text-muted">No se encontraron servicios</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.servicios.forEach(servicio => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div>
                        <strong>${servicio.nombre}</strong>
                        ${servicio.precio_anterior ? `
                            <br>
                            <small class="text-success">
                                <i class="fas fa-tag me-1"></i>Descuento: ${formatPrice(servicio.precio_anterior)} → ${formatPrice(servicio.precio)}
                            </small>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <div class="service-description-truncate" title="${servicio.descripcion || 'Sin descripción'}">
                        ${servicio.descripcion || '<em class="text-muted">Sin descripción</em>'}
                    </div>
                </td>
                <td>
                    <strong>${formatPrice(servicio.precio)}</strong>
                </td>
                <td>
                    <span class="badge bg-info">Configurado</span>
                </td>
                <td>
                    <div>
                        <strong>${formatNumber(servicio.total_reservas || 0)}</strong>
                        <br>
                        <small class="text-muted">${formatNumber(servicio.reservas_completadas || 0)} completadas</small>
                    </div>
                </td>
                <td>
                    <span class="badge ${servicio.estado === 'activo' ? 'bg-success' : 'bg-secondary'}">
                        ${servicio.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="servicesManager.verServicio(${servicio.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="servicesManager.editarServicio(${servicio.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="servicesManager.eliminarServicio(${servicio.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderPagination(pagination) {
        const paginationContainer = document.getElementById('paginationServices');
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
                this.loadServices();
            }
        });
        paginationContainer.appendChild(prevBtn);

        // Números de página
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `btn ${i === pagination.page ? 'btn-primary' : 'btn-outline-primary'} me-1`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.loadServices();
            });
            paginationContainer.appendChild(pageBtn);
        }

        // Botón siguiente
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-outline-primary ms-2';
        nextBtn.textContent = 'Siguiente';
        nextBtn.disabled = pagination.page >= pagination.pages;
        nextBtn.addEventListener('click', () => {
            if (pagination.page < pagination.pages) {
                this.currentPage = pagination.page + 1;
                this.loadServices();
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    updateStats() {
        // Calcular estadísticas
        const totalServices = this.servicios.length;
        const activeServices = this.servicios.filter(s => s.estado === 'activo').length;
        const totalBookings = this.servicios.reduce((sum, s) => sum + (parseInt(s.total_reservas) || 0), 0);
        const totalRevenue = this.servicios.reduce((sum, s) => sum + (parseFloat(s.total_recaudado) || 0), 0);

        // Actualizar elementos
        document.getElementById('totalServices').textContent = totalServices;
        document.getElementById('activeServices').textContent = activeServices;
        document.getElementById('totalBookings').textContent = totalBookings;
        document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue);
    }

    openModal(servicio = null) {
        this.editingService = servicio;
        const modal = new bootstrap.Modal(document.getElementById('serviceModal'));
        const modalTitle = document.getElementById('serviceModalTitle');
        
        if (servicio) {
            modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Servicio';
            this.populateForm(servicio);
        } else {
            modalTitle.innerHTML = '<i class="fas fa-concierge-bell me-2"></i>Nuevo Servicio';
            this.clearForm();
        }
        
        modal.show();
    }

    populateForm(servicio) {
        document.getElementById('serviceId').value = servicio.id;
        document.getElementById('serviceNombre').value = servicio.nombre;
        document.getElementById('servicePrecio').value = servicio.precio;
        document.getElementById('servicePrecioAnterior').value = servicio.precio_anterior || '';

        document.getElementById('serviceEstado').value = servicio.estado;
        document.getElementById('serviceDescripcion').value = servicio.descripcion || '';
        
        // Actualizar contador de caracteres
        const descripcion = document.getElementById('serviceDescripcion');
        document.getElementById('serviceDescripcionCount').textContent = descripcion.value.length;
    }

    clearForm() {
        document.getElementById('serviceId').value = '';
        document.getElementById('serviceNombre').value = '';
        document.getElementById('servicePrecio').value = '';
        document.getElementById('servicePrecioAnterior').value = '';

        document.getElementById('serviceEstado').value = 'activo';
        document.getElementById('serviceDescripcion').value = '';
        document.getElementById('serviceDescripcionCount').textContent = '0';
    }

    async guardarServicio() {
        try {
            const formData = {
                nombre: document.getElementById('serviceNombre').value.trim(),
                precio: parseFloat(document.getElementById('servicePrecio').value),
                precio_anterior: document.getElementById('servicePrecioAnterior').value ? parseFloat(document.getElementById('servicePrecioAnterior').value) : null,
                duracion: parseInt(document.getElementById('serviceDuracion').value),
                estado: document.getElementById('serviceEstado').value,
                descripcion: document.getElementById('serviceDescripcion').value.trim()
            };

            // Validaciones
            if (!formData.nombre) {
                this.showNotification('El nombre del servicio es requerido', 'error');
                return;
            }

            if (!formData.precio || formData.precio <= 0) {
                this.showNotification('El precio debe ser mayor a 0', 'error');
                return;
            }

            if (!formData.duracion || formData.duracion <= 0) {
                this.showNotification('La duración debe ser mayor a 0', 'error');
                return;
            }





            const serviceId = document.getElementById('serviceId').value;
            const url = serviceId ? `/dashboard/services/${serviceId}` : '/dashboard/services';
            const method = serviceId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification(result.message, 'success');
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('serviceModal'));
                modal.hide();
                
                // Recargar servicios
                await this.loadServices();
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Error guardando servicio', 'error');
            }
        } catch (error) {
            console.error('Error guardando servicio:', error);
            this.showNotification('Error guardando servicio', 'error');
        }
    }

    async verServicio(id) {
        try {
            const response = await fetch(`/dashboard/services/${id}`);
            
            if (response.ok) {
                const data = await response.json();
                this.mostrarDetallesServicio(data.data);
            } else {
                throw new Error('Error cargando detalles del servicio');
            }
        } catch (error) {
            console.error('Error cargando servicio:', error);
            this.showNotification('Error cargando detalles del servicio', 'error');
        }
    }

    mostrarDetallesServicio(servicio) {
        // Llenar información del servicio
        document.getElementById('viewServiceNombre').textContent = servicio.nombre;
        document.getElementById('viewServicePrecio').textContent = formatPrice(servicio.precio);

        document.getElementById('viewServiceEstado').innerHTML = `
            <span class="badge ${servicio.estado === 'activo' ? 'bg-success' : 'bg-secondary'}">
                ${servicio.estado === 'activo' ? 'Activo' : 'Inactivo'}
            </span>
        `;
        document.getElementById('viewServiceDescripcion').textContent = servicio.descripcion || 'Sin descripción';

        // Estadísticas
        document.getElementById('viewServiceTotalReservas').textContent = formatNumber(servicio.total_reservas || 0);
        document.getElementById('viewServiceReservasCompletadas').textContent = formatNumber(servicio.reservas_completadas || 0);
        document.getElementById('viewServiceIngresos').textContent = formatPrice(servicio.total_recaudado || 0);
        document.getElementById('viewServiceUltimaReserva').textContent = servicio.ultima_reserva ? this.formatDate(servicio.ultima_reserva) : 'Nunca';

        // Mostrar historial de precios
        this.renderPriceHistory(servicio.historial_precios || []);

        // Configurar botón de editar
        document.getElementById('editServiceBtn').onclick = () => {
            this.editingService = servicio;
            this.openModal(servicio);
        };

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('viewServiceModal'));
        modal.show();
    }

    renderPriceHistory(historial) {
        const tbody = document.getElementById('servicePriceHistoryTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (historial.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        No hay historial de cambios de precio
                    </td>
                </tr>
            `;
            return;
        }

        historial.forEach(cambio => {
            const row = document.createElement('tr');
            const cambioPrecio = parseFloat(cambio.precio_nuevo) - parseFloat(cambio.precio_anterior);
            const cambioClass = cambioPrecio > 0 ? 'price-change-positive' : cambioPrecio < 0 ? 'price-change-negative' : 'price-change-neutral';
            const cambioIcon = cambioPrecio > 0 ? '↗' : cambioPrecio < 0 ? '↘' : '→';
            
            row.innerHTML = `
                <td>${this.formatDate(cambio.fecha_cambio)}</td>
                <td>${formatPrice(cambio.precio_anterior)}</td>
                <td>${formatPrice(cambio.precio_nuevo)}</td>
                <td class="${cambioClass}">
                    ${cambioIcon} ${formatPrice(Math.abs(cambioPrecio))}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    editarServicio(id) {
        const servicio = this.servicios.find(s => s.id === id);
        if (servicio) {
            this.openModal(servicio);
        }
    }

    eliminarServicio(id) {
        this.showConfirmModal(
            '¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.',
            () => this.confirmarEliminarServicio(id)
        );
    }

    async confirmarEliminarServicio(id) {
        try {
            const response = await fetch(`/dashboard/services/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification(result.message, 'success');
                await this.loadServices();
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Error eliminando servicio', 'error');
            }
        } catch (error) {
            console.error('Error eliminando servicio:', error);
            this.showNotification('Error eliminando servicio', 'error');
        }
    }

    limpiarFiltros() {
        this.currentFilters = {};
        this.currentPage = 1;
        
        // Limpiar campos de filtro
        document.getElementById('filterServiceEstado').value = '';
        document.getElementById('searchService').value = '';
        document.getElementById('filterServicePrice').value = '';
        
        this.loadServices();
    }

    async exportarServicios() {
        try {
            const params = new URLSearchParams({
                ...this.currentFilters,
                export: 'true'
            });

            const response = await fetch(`/dashboard/services?${params}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `servicios_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showNotification('Servicios exportados exitosamente', 'success');
            } else {
                throw new Error('Error exportando servicios');
            }
        } catch (error) {
            console.error('Error exportando servicios:', error);
            this.showNotification('Error exportando servicios', 'error');
        }
    }

    showLoading(show) {
        const btnRefresh = document.getElementById('btnRefreshServices');
        if (btnRefresh) {
            btnRefresh.disabled = show;
            btnRefresh.innerHTML = show ? 
                '<i class="fas fa-spinner fa-spin me-1"></i>Cargando...' : 
                '<i class="fas fa-sync-alt me-1"></i>Actualizar';
        }
    }

    showNotification(message, type = 'info') {
        // Crear notificación toast
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remover toast después de que se oculte
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }

    showConfirmModal(message, onConfirm) {
        this.confirmCallback = onConfirm;
        document.getElementById('mensajeConfirmacion').textContent = message;
        const modal = new bootstrap.Modal(document.getElementById('modalConfirmacion'));
        modal.show();
    }

    confirmarAccion() {
        if (this.confirmCallback) {
            this.confirmCallback();
            this.confirmCallback = null;
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmacion'));
        modal.hide();
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Inicializar el manager cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.servicesManager = new ServicesManager();
}); 