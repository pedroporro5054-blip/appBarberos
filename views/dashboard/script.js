// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentUser = null;
    let dashboardData = null;
    
    // Hacer currentUser disponible globalmente
    window.currentUser = currentUser;

    // DOM elements
    const loadingOverlay = document.getElementById('loadingOverlay');
    const userNameElement = document.getElementById('userName');
    const welcomeUserNameElement = document.getElementById('welcomeUserName');
    const logoutBtn = document.getElementById('logoutBtn');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const dashboardSections = document.querySelectorAll('.dashboard-section');

    // Initialize dashboard
    initDashboard();

    // Initialize dashboard
    async function initDashboard() {
        showLoading();
        
        try {
            // Check authentication
            const authResult = await checkAuthentication();
            if (!authResult.authenticated) {
                window.location.href = '/auth/login';
                return;
            }

            // Set user info
            currentUser = authResult.user;
            updateUserInfo();

            // Load dashboard data
            await loadDashboardData();

            // Setup event listeners
            setupEventListeners();

            // Show overview by default
            showSection('overview');

        } catch (error) {
            console.error('Error initializing dashboard:', error);
            showError('Error cargando el dashboard');
        } finally {
            hideLoading();
        }
    }

    // Check authentication
    async function checkAuthentication() {
        try {
            const response = await fetch('/auth/verify', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    authenticated: data.success,
                    user: data.user
                };
            } else {
                // Si hay error 401 o 403, limpiar cookies y redirigir
                if (response.status === 401 || response.status === 403) {
                    console.log('Token inválido, redirigiendo al login...');
                    window.location.href = '/auth/login';
                    return { authenticated: false };
                }
                return { authenticated: false };
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            // En caso de error de red, también redirigir al login
            window.location.href = '/auth/login';
            return { authenticated: false };
        }
    }

    // Update user information in UI
    function updateUserInfo() {
        if (currentUser) {
            const fullName = `${currentUser.nombre} ${currentUser.apellido}`;
            userNameElement.textContent = fullName;
            welcomeUserNameElement.textContent = currentUser.nombre;
            
            // Actualizar la variable global
            window.currentUser = currentUser;
            
            // Guardar rol del usuario en localStorage para el panel de administración
            localStorage.setItem('userRole', currentUser.rol);
            
            // Mostrar solo el enlace de navegación de administración si es admin
            if (currentUser.rol === 'admin') {
                const adminNavItem = document.querySelector('.nav-item.admin-only');
                if (adminNavItem) {
                    adminNavItem.style.display = 'block';
                }
            } else {
                // Ocultar el enlace si no es admin
                const adminNavItem = document.querySelector('.nav-item.admin-only');
                if (adminNavItem) {
                    adminNavItem.style.display = 'none';
                }
            }
        }
    }

    // Load dashboard data
    async function loadDashboardData() {
        try {
            console.log('🔄 Cargando datos del dashboard...');
            console.log('📡 Haciendo request a /dashboard/stats');
            
            const response = await fetch('/dashboard/stats', {
                method: 'GET',
                credentials: 'include'
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Datos recibidos:', data);
                
                if (data.success) {
                    dashboardData = data;
                    // Hacer dashboardData disponible globalmente
                    window.dashboardData = dashboardData;
                    console.log('✅ Datos cargados exitosamente, actualizando UI...');
                    updateDashboardUI();
                } else {
                    throw new Error(data.message || 'Error al cargar datos del dashboard');
                }
            } else {
                throw new Error(`Error del servidor: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            // En lugar de usar datos de prueba, mostrar mensaje de error
            showError('Error al cargar los datos del dashboard. Por favor, recarga la página.');
            
            // Inicializar con datos vacíos pero válidos
            dashboardData = {
                stats: {
                    today: {
                        total_turnos: 0,
                        turnos_completados: 0,
                        turnos_cancelados: 0,
                        total_recaudado: 0
                    },
                    week: {
                        total_turnos: 0,
                        turnos_completados: 0,
                        total_recaudado: 0
                    },
                    month: {
                        total_turnos: 0,
                        turnos_completados: 0,
                        total_recaudado: 0
                    }
                },
                upcomingTurnos: [],
                popularServices: [],
                topClients: []
            };
            // Hacer dashboardData disponible globalmente
            window.dashboardData = dashboardData;
            console.log('⚠️ Usando datos por defecto');
            updateDashboardUI();
        }
    }

    // Update dashboard UI with data
    function updateDashboardUI() {
        if (!dashboardData) return;

        // Update stats
        updateStats();
        
        // Update upcoming appointments
        updateUpcomingAppointments();
        
        // Update popular services
        updatePopularServices();
    }

    // Update statistics cards
    function updateStats() {
        console.log('🔄 Actualizando estadísticas...');
        console.log('📊 dashboardData:', dashboardData);
        
        if (!dashboardData || !dashboardData.stats || !dashboardData.stats.today) {
            console.warn('⚠️ Datos de estadísticas no disponibles');
            console.log('  - dashboardData existe:', !!dashboardData);
            console.log('  - dashboardData.stats existe:', !!(dashboardData && dashboardData.stats));
            console.log('  - dashboardData.stats.today existe:', !!(dashboardData && dashboardData.stats && dashboardData.stats.today));
            return;
        }
        
        const stats = dashboardData.stats.today;
        console.log('📈 Estadísticas de hoy:', stats);
        
        // Actualizar métricas del dashboard principal
        const todayTurnosElement = document.getElementById('todayTurnos');
        const completedTurnosMainElement = document.getElementById('completedTurnosMain');
        const pendingTurnosElement = document.getElementById('pendingTurnos');
        const todayRevenueMainElement = document.getElementById('todayRevenueMain');
        
        console.log('🔍 Elementos del dashboard principal:');
        console.log('  - todayTurnos:', !!todayTurnosElement);
        console.log('  - completedTurnosMain:', !!completedTurnosMainElement);
        console.log('  - pendingTurnos:', !!pendingTurnosElement);
        console.log('  - todayRevenueMain:', !!todayRevenueMainElement);
        
        if (todayTurnosElement) todayTurnosElement.textContent = stats.total_turnos || 0;
        if (completedTurnosMainElement) completedTurnosMainElement.textContent = stats.turnos_completados || 0;
        if (pendingTurnosElement) pendingTurnosElement.textContent = (stats.turnos_reservados || 0) + (stats.turnos_confirmados || 0);
        if (todayRevenueMainElement) todayRevenueMainElement.textContent = formatPrice(stats.total_recaudado || 0);
        
        // Actualizar métricas de la sección de reportes si están disponibles
        const totalRevenueElement = document.getElementById('totalRevenue');
        const completedTurnosElement = document.getElementById('completedTurnos');
        const newClientsElement = document.getElementById('newClients');
        const averagePerTurnoElement = document.getElementById('averagePerTurno');
        const todayRevenueElement = document.getElementById('todayRevenue');
        
        console.log('🔍 Elementos de la sección de reportes:');
        console.log('  - totalRevenue:', !!totalRevenueElement);
        console.log('  - completedTurnos:', !!completedTurnosElement);
        console.log('  - newClients:', !!newClientsElement);
        console.log('  - averagePerTurno:', !!averagePerTurnoElement);
        console.log('  - todayRevenue:', !!todayRevenueElement);
        
        if (totalRevenueElement) totalRevenueElement.textContent = formatPrice(stats.total_recaudado || 0);
        if (completedTurnosElement) completedTurnosElement.textContent = stats.turnos_completados || 0;
        if (newClientsElement) newClientsElement.textContent = stats.nuevos_clientes || 0;
        if (averagePerTurnoElement) averagePerTurnoElement.textContent = formatPrice(stats.promedio_por_turno || 0);
        if (todayRevenueElement) todayRevenueElement.textContent = formatPrice(stats.total_recaudado || 0);
        
        console.log('✅ Estadísticas actualizadas');
    }

    // Update upcoming appointments list
    function updateUpcomingAppointments() {
        const container = document.getElementById('upcomingTurnosList');
        if (!container) {
            console.warn('⚠️ Elemento upcomingTurnosList no encontrado');
            return;
        }
        
        const appointments = dashboardData.upcomingTurnos;

        if (!appointments || appointments.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-calendar-times fa-3x mb-3"></i>
                    <p>No hay turnos programados</p>
                </div>
            `;
            return;
        }

        container.innerHTML = appointments.map(appointment => {
            const time = formatTime(appointment.hora_inicio);
            const date = formatDate(appointment.fecha);
            const statusClass = getStatusClass(appointment.estado);
            const statusText = getStatusText(appointment.estado);
            
            return `
                <div class="turno-item">
                    <div class="turno-time">
                        <div>${time}</div>
                        <small>${date}</small>
                    </div>
                    <div class="turno-info">
                        <div class="turno-client">
                            ${appointment.cliente_nombre} ${appointment.cliente_apellido}
                        </div>
                        <div class="turno-service">
                            ${appointment.servicio_nombre} - ${formatPrice(appointment.precio_final || 0)}
                        </div>
                    </div>
                    <div class="turno-status ${statusClass}">
                        ${statusText}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update popular services list
    function updatePopularServices() {
        const container = document.getElementById('popularServicesList');
        if (!container) {
            console.warn('⚠️ Elemento popularServicesList no encontrado');
            return;
        }
        
        const services = dashboardData.popularServices;

        if (!services || services.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-chart-bar fa-3x mb-3"></i>
                    <p>No hay datos disponibles</p>
                </div>
            `;
            return;
        }

        container.innerHTML = services.map(service => {
            return `
                <div class="service-item">
                    <div class="service-name">${service.nombre}</div>
                    <div class="service-stats">
                        <div class="service-count">${formatNumber(service.total_reservas || 0)}</div>
                        <div class="service-revenue">${formatPrice(service.total_recaudado || 0)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Setup event listeners
    function setupEventListeners() {
        // Navigation
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                showSection(section);
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Logout
        logoutBtn.addEventListener('click', handleLogout);

        // Toggle ingresos diarios
        const toggleIngresosBtn = document.getElementById('toggleIngresosBtn');
        if (toggleIngresosBtn) {
            toggleIngresosBtn.addEventListener('click', toggleIngresosDetalles);
        }
    }

    // Show section
    function showSection(sectionName) {
        // Hide all sections
        dashboardSections.forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        
        if (targetSection) {
            targetSection.classList.add('active');
            
                    // Special handling for admin section
        if (sectionName === 'admin') {
            // Show admin section and load data
            targetSection.style.display = 'block';
            loadAdminSection();
        } else {
            // Hide admin section when showing other sections
            const adminSection = document.getElementById('admin');
            if (adminSection) {
                adminSection.style.display = 'none';
            }
            
            // Load section data
            switch (sectionName) {
                case 'appointments':
                    loadAppointments();
                    break;
                case 'clients':
                    loadClients();
                    break;
                case 'services':
                    loadServices();
                    break;
                case 'schedule':
                    loadSchedule();
                    break;
                case 'reports':
                    loadReports();
                    // Actualizar métricas de reportes cuando se cambie a esa sección
                    setTimeout(() => {
                        updateReportMetrics();
                    }, 100);
                    break;
            }
        }
        }
    }

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
                    showError('Error al cargar los turnos');
                }
            } else {
                throw new Error(`Error del servidor: ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
            showError('Error al cargar los turnos');
        }
    }

    // Render appointments
    function renderAppointments(appointments, pagination) {
        const container = document.getElementById('turnosTableBody');
        if (!container) return;

        if (!appointments || appointments.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="fas fa-calendar-times fa-3x mb-3"></i>
                        <p>No hay turnos registrados</p>
                    </td>
                </tr>
            `;
            return;
        }

                container.innerHTML = appointments.map(appointment => {
            const date = formatDate(appointment.fecha);
            const time = formatTime(appointment.hora_inicio);
            const statusClass = getStatusClass(appointment.estado);
            const statusText = getStatusText(appointment.estado);
            
            return `
                <tr data-id="${appointment.id}">
                    <td>
                        <strong>${appointment.cliente_nombre} ${appointment.cliente_apellido}</strong>
                        <br><small class="text-muted">${appointment.cliente_telefono}</small>
                    </td>
                    <td>${appointment.servicio_nombre}</td>
                    <td>${date}</td>
                    <td>${time}</td>
                    <td>
                        <span class="badge bg-${statusClass}">${statusText}</span>
                    </td>
                    <td>
                        <span class="text-success fw-bold">${formatPrice(appointment.precio_final || 0)}</span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="viewAppointment(${appointment.id})" title="Ver">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-success" onclick="updateAppointmentStatus(${appointment.id}, 'completado')" title="Completar">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteAppointment(${appointment.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Render pagination
        // TODO: Implementar paginación
        // renderPagination(container, pagination, loadAppointments);
    }

    // Load clients
    async function loadClients() {
        try {
            const searchTerm = document.getElementById('clientSearchInput')?.value || '';
            const url = searchTerm ? 
                `/api/clients?search=${encodeURIComponent(searchTerm)}` : 
                '/api/clients';
            
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderClientsTable(data.data.clients, data.data.pagination);
                    loadClientStats();
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

    // Render clients table
    function renderClientsTable(clients, pagination) {
        const tbody = document.getElementById('clientsTableBody');
        const showingSpan = document.getElementById('clientsShowing');
        const totalSpan = document.getElementById('clientsTotal');

        if (!tbody) {
            console.warn('⚠️ Elemento clientsTableBody no encontrado');
            return;
        }

        if (!clients || clients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="fas fa-users fa-3x mb-3"></i>
                        <p>No hay clientes registrados</p>
                    </td>
                </tr>
            `;
            if (showingSpan) showingSpan.textContent = '0';
            if (totalSpan) totalSpan.textContent = '0';
            return;
        }

        tbody.innerHTML = clients.map(client => {
            const ultimoTurno = client.ultima_cita ? formatDate(client.ultima_cita) : 'Nunca';
            const totalTurnos = client.total_citas || 0;
            
            return `
                <tr>
                    <td>
                        <strong>${client.nombre} ${client.apellido}</strong>
                    </td>
                    <td>${client.telefono}</td>
                    <td>${client.email || '-'}</td>
                    <td>
                        <span class="badge bg-primary">${totalTurnos}</span>
                    </td>
                    <td>${ultimoTurno}</td>
                    <td>
                        <span class="badge bg-success">Activo</span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="viewClient(${client.id})" title="Ver">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-warning" onclick="editClient(${client.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteClient(${client.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Update pagination info
        if (pagination) {
            showingSpan.textContent = clients.length;
            totalSpan.textContent = pagination.total;
            renderClientsPagination(pagination);
        }
    }

    // Render clients pagination
    function renderClientsPagination(pagination) {
        const container = document.getElementById('clientsPagination');
        if (!container) {
            console.warn('⚠️ Elemento clientsPagination no encontrado');
            return;
        }
        
        if (!pagination || pagination.pages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${pagination.page <= 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changeClientsPage(${pagination.page - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= pagination.pages; i++) {
            if (i === 1 || i === pagination.pages || (i >= pagination.page - 2 && i <= pagination.page + 2)) {
                paginationHTML += `
                    <li class="page-item ${i === pagination.page ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="changeClientsPage(${i})">${i}</a>
                    </li>
                `;
            } else if (i === pagination.page - 3 || i === pagination.page + 3) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${pagination.page >= pagination.pages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changeClientsPage(${pagination.page + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        container.innerHTML = paginationHTML;
    }

    // Load client statistics
    async function loadClientStats() {
        try {
            const response = await fetch('/api/clients/stats', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    updateClientStats(data.data);
                }
            }
        } catch (error) {
            console.error('Error loading client stats:', error);
        }
    }

    // Update client statistics
    function updateClientStats(stats) {
        document.getElementById('totalClients').textContent = stats.total || 0;
        document.getElementById('newClients').textContent = stats.nuevos || 0;
        document.getElementById('frequentClients').textContent = stats.frecuentes || 0;
        document.getElementById('activeClients').textContent = stats.activos || 0;
    }

    // Setup client event listeners
    function setupClientEventListeners() {
        // Add client button
        const addClientBtn = document.getElementById('addClientBtn');
        if (addClientBtn) {
            addClientBtn.addEventListener('click', () => {
                showClientModal();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('clientSearchInput');
        const searchBtn = document.getElementById('clientSearchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    loadClients();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', loadClients);
        }

        // Client form
        const clientForm = document.getElementById('clientForm');
        const saveClientBtn = document.getElementById('saveClientBtn');
        const clientNotas = document.getElementById('clientNotas');
        const notasCount = document.getElementById('notasCount');

        if (clientNotas && notasCount) {
            clientNotas.addEventListener('input', () => {
                const count = clientNotas.value.length;
                notasCount.textContent = count;
                if (count > 450) {
                    notasCount.style.color = '#dc3545';
                } else if (count > 400) {
                    notasCount.style.color = '#ffc107';
                } else {
                    notasCount.style.color = 'inherit';
                }
            });
        }

        if (saveClientBtn) {
            saveClientBtn.addEventListener('click', saveClient);
        }

        // View client modal
        const editClientBtn = document.getElementById('editClientBtn');
        if (editClientBtn) {
            editClientBtn.addEventListener('click', () => {
                const clientId = editClientBtn.dataset.clientId;
                if (clientId) {
                    editClient(parseInt(clientId));
                }
            });
        }
    }

    // Show client modal (add or edit)
    function showClientModal(client = null) {
        const modalElement = document.getElementById('clientModal');
        const modalTitle = document.getElementById('clientModalTitle');
        const clientId = document.getElementById('clientId');
        const form = document.getElementById('clientForm');

        if (!modalElement || !modalTitle || !clientId || !form) {
            console.warn('⚠️ Elementos del modal de cliente no encontrados');
            return;
        }

        const modal = new bootstrap.Modal(modalElement);

        if (client) {
            // Edit mode
            modalTitle.innerHTML = '<i class="fas fa-user-edit me-2"></i>Editar Cliente';
            clientId.value = client.id;
            
            const nombreField = document.getElementById('clientNombre');
            const apellidoField = document.getElementById('clientApellido');
            const telefonoField = document.getElementById('clientTelefono');
            const emailField = document.getElementById('clientEmail');
            const fechaField = document.getElementById('clientFechaNacimiento');
            const notasField = document.getElementById('clientNotas');
            
            if (nombreField) nombreField.value = client.nombre;
            if (apellidoField) apellidoField.value = client.apellido;
            if (telefonoField) telefonoField.value = client.telefono;
            if (emailField) emailField.value = client.email || '';
            if (fechaField) fechaField.value = client.fecha_nacimiento || '';
            if (notasField) notasField.value = client.notas || '';
            
            // Update character count
            const notasCount = document.getElementById('notasCount');
            if (notasCount) {
                notasCount.textContent = (client.notas || '').length;
            }
        } else {
            // Add mode
            modalTitle.innerHTML = '<i class="fas fa-user-plus me-2"></i>Nuevo Cliente';
            clientId.value = '';
            form.reset();
            const notasCount = document.getElementById('notasCount');
            if (notasCount) notasCount.textContent = '0';
        }

        modal.show();
    }

    // Save client (create or update)
    async function saveClient() {
        const clientId = document.getElementById('clientId')?.value;
        const nombreField = document.getElementById('clientNombre');
        const apellidoField = document.getElementById('clientApellido');
        const telefonoField = document.getElementById('clientTelefono');
        const emailField = document.getElementById('clientEmail');
        const fechaField = document.getElementById('clientFechaNacimiento');
        const notasField = document.getElementById('clientNotas');
        
        if (!nombreField || !apellidoField || !telefonoField) {
            console.warn('⚠️ Campos del formulario de cliente no encontrados');
            return;
        }
        
        const formData = {
            nombre: nombreField.value.trim(),
            apellido: apellidoField.value.trim(),
            telefono: telefonoField.value.trim(),
            email: emailField?.value.trim() || null,
            fecha_nacimiento: fechaField?.value || null,
            notas: notasField?.value.trim() || null
        };

        // Validation
        if (!formData.nombre || !formData.apellido || !formData.telefono) {
            showError('Por favor completa todos los campos obligatorios');
            return;
        }

        try {
            const url = clientId ? `/api/clients/${clientId}` : '/api/clients';
            const method = clientId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    showSuccess(data.message);
                    const modalElement = document.getElementById('clientModal');
                    if (modalElement) {
                        const modalInstance = bootstrap.Modal.getInstance(modalElement);
                        if (modalInstance) modalInstance.hide();
                    }
                    loadClients();
                } else {
                    showError(data.message);
                }
            } else {
                const errorData = await response.json();
                showError(errorData.message || 'Error al guardar el cliente');
            }
        } catch (error) {
            console.error('Error saving client:', error);
            showError('Error al guardar el cliente');
        }
    }

    // View client details
    async function viewClient(id) {
        try {
            const response = await fetch(`/api/clients/${id}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    showClientDetailsModal(data.data);
                } else {
                    showError(data.message);
                }
            } else {
                throw new Error(`Error del servidor: ${response.status}`);
            }
        } catch (error) {
            console.error('Error viewing client:', error);
            showError('Error al cargar los detalles del cliente');
        }
    }

    // Show client details modal
    function showClientDetailsModal(data) {
        const modalElement = document.getElementById('viewClientModal');
        if (!modalElement) {
            console.warn('⚠️ Modal de detalles de cliente no encontrado');
            return;
        }
        
        const modal = new bootstrap.Modal(modalElement);
        
        // Fill client information
        const nombreElement = document.getElementById('viewClientNombre');
        const telefonoElement = document.getElementById('viewClientTelefono');
        const emailElement = document.getElementById('viewClientEmail');
        const fechaElement = document.getElementById('viewClientFechaNacimiento');
        const notasElement = document.getElementById('viewClientNotas');
        const totalCitasElement = document.getElementById('viewClientTotalCitas');
        const ultimoTurnoElement = document.getElementById('viewClientUltimoTurno');
        const estadoElement = document.getElementById('viewClientEstado');
        
        if (nombreElement) nombreElement.textContent = `${data.client.nombre} ${data.client.apellido}`;
        if (telefonoElement) telefonoElement.textContent = data.client.telefono;
        if (emailElement) emailElement.textContent = data.client.email || '-';
        if (fechaElement) fechaElement.textContent = data.client.fecha_nacimiento ? formatDate(data.client.fecha_nacimiento) : '-';
        if (notasElement) notasElement.textContent = data.client.notas || '-';
        if (totalCitasElement) totalCitasElement.textContent = data.client.total_citas || 0;
        if (ultimoTurnoElement) ultimoTurnoElement.textContent = data.client.ultima_cita ? formatDate(data.client.ultima_cita) : 'Nunca';
        if (estadoElement) estadoElement.textContent = 'Activo';
        
        // Fill appointment history
        const historyTbody = document.getElementById('clientHistoryTableBody');
        if (historyTbody) {
            if (data.appointmentHistory && data.appointmentHistory.length > 0) {
                historyTbody.innerHTML = data.appointmentHistory.map(appointment => `
                    <tr>
                        <td>${formatDate(appointment.fecha)}</td>
                        <td>${formatTime(appointment.hora_inicio)}</td>
                        <td>${appointment.servicio_nombre}</td>
                        <td>
                            <span class="badge ${getStatusClass(appointment.estado)}">
                                ${getStatusText(appointment.estado)}
                            </span>
                        </td>
                    </tr>
                `).join('');
            } else {
                historyTbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted">
                            No hay historial de turnos
                        </td>
                    </tr>
                `;
            }
        }

        // Set client ID for edit button
        const editBtn = document.getElementById('editClientBtn');
        if (editBtn) editBtn.dataset.clientId = data.client.id;

        modal.show();
    }

    // Edit client
    async function editClient(id) {
        try {
            const response = await fetch(`/api/clients/${id}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    showClientModal(data.data.client);
                } else {
                    showError(data.message);
                }
            } else {
                throw new Error(`Error del servidor: ${response.status}`);
            }
        } catch (error) {
            console.error('Error editing client:', error);
            showError('Error al cargar el cliente para editar');
        }
    }

    // Delete client
    async function deleteClient(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch(`/api/clients/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    showSuccess('Cliente eliminado exitosamente');
                    loadClients();
                } else {
                    showError(data.message);
                }
            } else {
                const errorData = await response.json();
                showError(errorData.message || 'Error al eliminar el cliente');
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            showError('Error al eliminar el cliente');
        }
    }

    // Change clients page
    function changeClientsPage(page) {
        // TODO: Implement pagination for clients
        console.log('Change clients page:', page);
    }

    // Global functions for client management
    window.viewClient = viewClient;
    window.editClient = editClient;
    window.deleteClient = deleteClient;
    window.changeClientsPage = changeClientsPage;

    // Initialize client event listeners when section is shown
    const originalShowSection = showSection;
    showSection = function(sectionName) {
        originalShowSection(sectionName);
        if (sectionName === 'clients') {
            loadClients();
            setupClientEventListeners();
        }
    };

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
        if (!container) {
            console.warn('⚠️ Elemento servicesList no encontrado');
            return;
        }

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
                            <i class="fas fa-clock me-1"></i>${service.duracion || 30} min
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
        // TODO: Implementar paginación
        // renderPagination(container, pagination, loadServices);
    }

    // Edit service function
    function editService(serviceId) {
        console.log('Editando servicio:', serviceId);
        // TODO: Implementar edición de servicio
        showInfo('Función de edición de servicio en desarrollo');
    }

    // Delete service function
    function deleteService(serviceId) {
        console.log('Eliminando servicio:', serviceId);
        // TODO: Implementar eliminación de servicio
        showInfo('Función de eliminación de servicio en desarrollo');
    }



    // Placeholder functions for other sections
    function loadSchedule() {
        console.log('Loading schedule...');
        // TODO: Implement schedule functionality
    }

    function loadReports() {
        console.log('Loading reports...');
        // Si la función initializeReportsPage está disponible (desde reports.js), usarla
        if (typeof initializeReportsPage === 'function') {
            initializeReportsPage();
        } else {
            // Si no está disponible, actualizar las métricas básicas
            updateReportMetrics();
        }
    }

    // Load admin section
    function loadAdminSection() {
        // Verificar si el usuario es admin
        if (currentUser && currentUser.rol === 'admin') {
            // Inicializar el panel de administración si no está inicializado
            if (typeof AdminPanel !== 'undefined' && !window.adminPanel) {
                window.adminPanel = new AdminPanel();
            } else if (typeof AdminPanel !== 'undefined' && window.adminPanel) {
                // Si ya existe, recargar los datos
                window.adminPanel.loadAdminData();
            }
        } else {
            // Si no es admin, redirigir a overview
            showSection('overview');
        }
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

    window.changePage = function(page, loadFunction) {
        // TODO: Implement page change functionality
        console.log('Change page:', page, loadFunction);
    };

    // Utility functions
    function showSuccess(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container-fluid');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
            
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }

    function showAppointmentModal(appointment) {
        // TODO: Implement appointment modal
        console.log('Show appointment modal:', appointment);
    }

    // Handle logout
    async function handleLogout() {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = '/auth/login';
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            // Force redirect anyway
            window.location.href = '/auth/login';
        }
    }

    // Utility functions
    function formatTime(timeString) {
        const time = new Date(`2000-01-01T${timeString}`);
        return time.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit' 
        });
    }

    function getStatusClass(status) {
        const statusMap = {
            'reservado': 'status-reserved',
            'confirmado': 'status-confirmed',
            'completado': 'status-completed',
            'cancelado': 'status-cancelled'
        };
        return statusMap[status] || 'status-reserved';
    }

    function getStatusText(status) {
        const statusMap = {
            'reservado': 'Reservado',
            'confirmado': 'Confirmado',
            'completado': 'Completado',
            'cancelado': 'Cancelado'
        };
        return statusMap[status] || 'Reservado';
    }

    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
        }
    }

    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }

    function showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
        `;
        
        const container = document.querySelector('.container-fluid');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
            
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }

    // Auto-refresh dashboard data every 5 minutes
    setInterval(async () => {
        if (currentUser) {
            await loadDashboardData();
        }
    }, 5 * 60 * 1000);

    // Handle page visibility change
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && currentUser) {
            loadDashboardData();
        }
    });

    // Toggle ingresos diarios
    function toggleIngresosDetalles() {
        const revenueElement = document.getElementById('todayRevenueMain');
        const btn = document.getElementById('toggleIngresosBtn');
        
        if (!revenueElement || !btn) {
            console.warn('⚠️ Elementos para toggle de ingresos no encontrados');
            return;
        }
        
        if (revenueElement.style.display === 'none') {
            // Mostrar el número
            revenueElement.style.display = 'block';
            btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            btn.title = 'Ocultar ingresos';
        } else {
            // Ocultar el número
            revenueElement.style.display = 'none';
            btn.innerHTML = '<i class="fas fa-eye"></i>';
            btn.title = 'Mostrar ingresos';
        }
    }



    // ===== FUNCIONES DE FORMATEO =====
    
    function formatPrice(amount) {
        if (amount === null || amount === undefined) return '$0';
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    function formatNumber(number) {
        if (number === null || number === undefined) return '0';
        return new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    }

    // ===== FUNCIÓN PARA ACTUALIZAR MÉTRICAS DE REPORTES =====
    
    function updateReportMetrics() {
        // Esta función se puede llamar desde la sección de reportes
        // para actualizar las métricas cuando se carguen los datos
        // SOLO si no estamos en la sección de reportes activa
        const reportsSection = document.getElementById('reports');
        if (reportsSection && reportsSection.classList.contains('active')) {
            console.log('⚠️ Sección de reportes activa - no actualizando métricas desde dashboard');
            return; // No actualizar si estamos en reportes
        }
        
        // Los nuevos reportes no usan updateMetrics, así que no hacemos nada aquí
        console.log('ℹ️ Reportes simples no requieren actualización desde dashboard');
    }

    // ===== GLOBAL FUNCTIONS FOR CLIENT MANAGEMENT =====

    // Global functions for client actions
    window.showSuccess = showSuccess;
}); 