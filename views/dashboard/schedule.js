// Schedule Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Variables globales
    let workingHours = [];
    let specialDays = [];
    let scheduleConfig = {};

    // Inicializar la página de horarios
    initializeSchedulePage();

    // Inicializar la página de horarios
    async function initializeSchedulePage() {
        try {
            // Cargar datos desde la API
            await Promise.all([
                loadWorkingHours(),
                loadSpecialDays(),
                loadScheduleConfig()
            ]);

            // Renderizar datos
            renderWorkingHours();
            renderSpecialDays();
            renderScheduleConfig();
            renderWeeklyOverview();

            // Setup event listeners
            setupScheduleEventListeners();
        } catch (error) {
            console.error('Error inicializando página de horarios:', error);
            showErrorMessage('Error cargando los datos de horarios');
        }
    }

    // Cargar horarios laborales desde la API
    async function loadWorkingHours() {
        try {
            const response = await fetch('/api/schedule/working-hours', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Error cargando horarios laborales');
            }

            const result = await response.json();
            if (result.success) {
                workingHours = result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error cargando horarios laborales:', error);
            workingHours = [];
        }
    }

    // Cargar días especiales desde la API
    async function loadSpecialDays() {
        try {
            const response = await fetch('/api/schedule/special-days', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Error cargando días especiales');
            }

            const result = await response.json();
            if (result.success) {
                specialDays = result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error cargando días especiales:', error);
            specialDays = [];
        }
    }

    // Cargar configuración de horarios desde la API
    async function loadScheduleConfig() {
        try {
            const response = await fetch('/api/schedule/config', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Error cargando configuración');
            }

            const result = await response.json();
            if (result.success) {
                scheduleConfig = result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error cargando configuración:', error);
            scheduleConfig = {
                intervalo_turnos: 30,
                anticipacion_reserva: 1440,
                max_reservas_dia: 20,
                permitir_reservas_mismo_dia: true
            };
        }
    }

    // Renderizar horarios laborales en la tabla
    function renderWorkingHours() {
        const tableBody = document.getElementById('scheduleTableBody');
        if (!tableBody) return;

        const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        let html = '';

        diasSemana.forEach((dia, index) => {
            const horario = workingHours.find(h => h.dia_semana === dia);
            
            if (horario && horario.estado === 'activo') {
                const pausa = horario.pausa_inicio && horario.pausa_fin 
                    ? `${horario.pausa_inicio} - ${horario.pausa_fin}`
                    : 'Sin pausa';

                html += `
                    <tr>
                        <td>${nombresDias[index]}</td>
                        <td>${horario.hora_inicio}</td>
                        <td>${horario.hora_fin}</td>
                        <td>${pausa}</td>
                        <td><span class="badge bg-success">Activo</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary edit-schedule" data-id="${horario.id}" data-day="${dia}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-schedule" data-id="${horario.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            } else {
                html += `
                    <tr>
                        <td>${nombresDias[index]}</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td><span class="badge bg-secondary">Inactivo</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-success add-schedule" data-day="${dia}">
                                <i class="fas fa-plus"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }
        });

        tableBody.innerHTML = html;
    }

    // Renderizar días especiales
    function renderSpecialDays() {
        const container = document.getElementById('specialDaysContainer');
        if (!container) return;

        if (specialDays.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <p class="text-center text-muted py-4">
                        <i class="fas fa-calendar-day fa-2x mb-3"></i>
                        <br>No hay días especiales configurados
                    </p>
                </div>
            `;
            return;
        }

        let html = '';
        specialDays.forEach(day => {
            const fecha = new Date(day.fecha);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            const badgeClass = {
                'vacaciones': 'bg-info',
                'feriado': 'bg-danger',
                'enfermedad': 'bg-warning',
                'otro': 'bg-secondary'
            }[day.tipo] || 'bg-secondary';

            const badgeText = {
                'vacaciones': 'Vacaciones',
                'feriado': 'Feriado',
                'enfermedad': 'Enfermedad',
                'otro': 'Otro'
            }[day.tipo] || 'Otro';

            html += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="special-day-card">
                        <div class="special-day-header">
                            <span class="special-day-date">${fechaFormateada}</span>
                            <span class="badge ${badgeClass}">${badgeText}</span>
                        </div>
                        <div class="special-day-content">
                            <h6>${day.descripcion || 'Sin título'}</h6>
                            <p class="text-muted">${day.todo_dia ? 'Todo el día' : `${day.hora_inicio} - ${day.hora_fin}`}</p>
                            <div class="special-day-actions">
                                <button class="btn btn-sm btn-outline-primary edit-special-day" data-id="${day.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-special-day" data-id="${day.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Renderizar configuración de horarios
    function renderScheduleConfig() {
        if (!scheduleConfig) return;

        // Configurar valores en el formulario
        const intervaloTurnos = document.getElementById('intervaloTurnos');
        const anticipacionReserva = document.getElementById('anticipacionReserva');
        const maxReservasDia = document.getElementById('maxReservasDia');
        const permitirReservasMismoDia = document.getElementById('permitirReservasMismoDia');

        if (intervaloTurnos) intervaloTurnos.value = scheduleConfig.intervalo_turnos || 30;
        if (anticipacionReserva) anticipacionReserva.value = scheduleConfig.anticipacion_reserva || 1440;
        if (maxReservasDia) maxReservasDia.value = scheduleConfig.max_reservas_dia || 20;
        if (permitirReservasMismoDia) permitirReservasMismoDia.checked = scheduleConfig.permitir_reservas_mismo_dia !== false;
    }

    // Renderizar vista semanal
    function renderWeeklyOverview() {
        const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        diasSemana.forEach((dia, index) => {
            const dayElement = document.querySelector(`[data-day="${dia}"]`);
            if (!dayElement) return;

            const horario = workingHours.find(h => h.dia_semana === dia);
            const dayHeader = dayElement.querySelector('.day-header');
            const dayHours = dayElement.querySelector('.day-hours');

            if (horario && horario.estado === 'activo') {
                // Día activo
                dayHeader.querySelector('.day-status').className = 'day-status active';
                dayHours.querySelector('.hours').textContent = `${horario.hora_inicio} - ${horario.hora_fin}`;
            } else {
                // Día inactivo
                dayHeader.querySelector('.day-status').className = 'day-status inactive';
                dayHours.querySelector('.hours').textContent = 'Cerrado';
            }
        });
    }

    // Setup schedule management event listeners
    function setupScheduleEventListeners() {
        // Configuration form
        const configForm = document.getElementById('configForm');
        if (configForm) {
            configForm.addEventListener('submit', handleConfigSubmit);
        }

        // Add schedule button
        const addScheduleBtn = document.getElementById('addScheduleBtn');
        if (addScheduleBtn) {
            addScheduleBtn.addEventListener('click', showAddScheduleModal);
        }

        // Add special day button
        const addSpecialDayBtn = document.getElementById('addSpecialDayBtn');
        if (addSpecialDayBtn) {
            addSpecialDayBtn.addEventListener('click', showAddSpecialDayModal);
        }

        // Delegación de eventos para botones dinámicos
        document.addEventListener('click', function(e) {
            // Edit schedule buttons
            if (e.target.closest('.edit-schedule')) {
                const btn = e.target.closest('.edit-schedule');
                const scheduleId = btn.getAttribute('data-id');
                const dayName = btn.getAttribute('data-day');
                showEditScheduleModal(scheduleId, dayName);
            }

            // Delete schedule buttons
            if (e.target.closest('.delete-schedule')) {
                const btn = e.target.closest('.delete-schedule');
                const scheduleId = btn.getAttribute('data-id');
                confirmDeleteSchedule(scheduleId);
            }

            // Add schedule buttons
            if (e.target.closest('.add-schedule')) {
                const btn = e.target.closest('.add-schedule');
                const dayName = btn.getAttribute('data-day');
                showEditScheduleModal(null, dayName);
            }

            // Edit special day buttons
            if (e.target.closest('.edit-special-day')) {
                const btn = e.target.closest('.edit-special-day');
                const specialDayId = btn.getAttribute('data-id');
                showEditSpecialDayModal(specialDayId);
            }

            // Delete special day buttons
            if (e.target.closest('.delete-special-day')) {
                const btn = e.target.closest('.delete-special-day');
                const specialDayId = btn.getAttribute('data-id');
                confirmDeleteSpecialDay(specialDayId);
            }
        });

        // Weekly overview day clicks
        document.querySelectorAll('.week-day').forEach(day => {
            day.addEventListener('click', function() {
                const dayName = this.getAttribute('data-day');
                showEditScheduleModal(null, dayName);
            });
        });
    }

    // Handle configuration form submit
    async function handleConfigSubmit(e) {
        e.preventDefault();
        
        const formData = {
            intervalo_turnos: parseInt(document.getElementById('intervaloTurnos').value),
            anticipacion_reserva: parseInt(document.getElementById('anticipacionReserva').value),
            max_reservas_dia: parseInt(document.getElementById('maxReservasDia').value),
            permitir_reservas_mismo_dia: document.getElementById('permitirReservasMismoDia').checked
        };

        try {
            const response = await fetch('/api/schedule/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    showSuccessMessage('Configuración actualizada exitosamente');
                    scheduleConfig = { ...scheduleConfig, ...formData };
                } else {
                    throw new Error(result.message);
                }
            } else {
                throw new Error('Error actualizando configuración');
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
            showErrorMessage('Error guardando la configuración');
        }
    }

    // Show add schedule modal
    function showAddScheduleModal() {
        showModal('Agregar Horario', getScheduleModalContent());
    }

    // Show edit schedule modal
    function showEditScheduleModal(scheduleId, dayName = null) {
        const title = scheduleId ? 'Editar Horario' : `Configurar ${dayName}`;
        const horario = scheduleId ? workingHours.find(h => h.id == scheduleId) : null;
        showModal(title, getScheduleModalContent(scheduleId, dayName, horario));
    }

    // Show add special day modal
    function showAddSpecialDayModal() {
        showModal('Agregar Día Especial', getSpecialDayModalContent());
    }

    // Show edit special day modal
    function showEditSpecialDayModal(specialDayId) {
        const specialDay = specialDays.find(d => d.id == specialDayId);
        showModal('Editar Día Especial', getSpecialDayModalContent(specialDayId, specialDay));
    }

    // Get schedule modal content
    function getScheduleModalContent(scheduleId = null, dayName = null, horario = null) {
        const diasSemana = [
            { value: 'lunes', label: 'Lunes' },
            { value: 'martes', label: 'Martes' },
            { value: 'miercoles', label: 'Miércoles' },
            { value: 'jueves', label: 'Jueves' },
            { value: 'viernes', label: 'Viernes' },
            { value: 'sabado', label: 'Sábado' },
            { value: 'domingo', label: 'Domingo' }
        ];

        let dayOptions = '';
        diasSemana.forEach(dia => {
            const selected = dayName === dia.value ? 'selected' : '';
            dayOptions += `<option value="${dia.value}" ${selected}>${dia.label}</option>`;
        });

        return `
            <form id="scheduleForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="scheduleDay" class="form-label">Día de la semana</label>
                        <select class="form-select" id="scheduleDay" ${dayName ? 'disabled' : ''}>
                            ${dayOptions}
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="scheduleStatus" class="form-label">Estado</label>
                        <select class="form-select" id="scheduleStatus">
                            <option value="activo" ${horario?.estado === 'activo' ? 'selected' : ''}>Activo</option>
                            <option value="inactivo" ${horario?.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                        </select>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="scheduleStart" class="form-label">Hora de inicio</label>
                        <input type="time" class="form-control" id="scheduleStart" value="${horario?.hora_inicio || '09:00'}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="scheduleEnd" class="form-label">Hora de fin</label>
                        <input type="time" class="form-control" id="scheduleEnd" value="${horario?.hora_fin || '18:00'}">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="scheduleBreakStart" class="form-label">Inicio de pausa</label>
                        <input type="time" class="form-control" id="scheduleBreakStart" value="${horario?.pausa_inicio || '13:00'}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="scheduleBreakEnd" class="form-label">Fin de pausa</label>
                        <input type="time" class="form-control" id="scheduleBreakEnd" value="${horario?.pausa_fin || '14:00'}">
                    </div>
                </div>
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="scheduleHasBreak" ${horario?.pausa_inicio ? 'checked' : ''}>
                    <label class="form-check-label" for="scheduleHasBreak">
                        Incluir pausa de almuerzo
                    </label>
                </div>
                <div class="d-flex justify-content-end gap-2">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Horario</button>
                </div>
            </form>
        `;
    }

    // Get special day modal content
    function getSpecialDayModalContent(specialDayId = null, specialDay = null) {
        const tipos = [
            { value: 'vacaciones', label: 'Vacaciones' },
            { value: 'feriado', label: 'Feriado' },
            { value: 'enfermedad', label: 'Enfermedad' },
            { value: 'otro', label: 'Otro' }
        ];

        let tipoOptions = '';
        tipos.forEach(tipo => {
            const selected = specialDay?.tipo === tipo.value ? 'selected' : '';
            tipoOptions += `<option value="${tipo.value}" ${selected}>${tipo.label}</option>`;
        });

        return `
            <form id="specialDayForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="specialDayDate" class="form-label">Fecha</label>
                        <input type="date" class="form-control" id="specialDayDate" value="${specialDay?.fecha || ''}" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="specialDayType" class="form-label">Tipo</label>
                        <select class="form-select" id="specialDayType" required>
                            ${tipoOptions}
                        </select>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="specialDayTitle" class="form-label">Título</label>
                    <input type="text" class="form-control" id="specialDayTitle" value="${specialDay?.descripcion || ''}" placeholder="Ej: Navidad, Vacaciones de verano" required>
                </div>
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="specialDayAllDay" ${specialDay?.todo_dia ? 'checked' : ''}>
                    <label class="form-check-label" for="specialDayAllDay">
                        Todo el día
                    </label>
                </div>
                <div class="row" id="specialDayTimeRow" style="display: ${specialDay?.todo_dia ? 'none' : 'flex'};">
                    <div class="col-md-6 mb-3">
                        <label for="specialDayStart" class="form-label">Hora de inicio</label>
                        <input type="time" class="form-control" id="specialDayStart" value="${specialDay?.hora_inicio || ''}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="specialDayEnd" class="form-label">Hora de fin</label>
                        <input type="time" class="form-control" id="specialDayEnd" value="${specialDay?.hora_fin || ''}">
                    </div>
                </div>
                <div class="d-flex justify-content-end gap-2">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-warning">Guardar Día Especial</button>
                </div>
            </form>
        `;
    }

    // Show modal
    function showModal(title, content) {
        const modalHtml = `
            <div class="modal fade" id="scheduleModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existingModal = document.getElementById('scheduleModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
        modal.show();

        // Setup form event listeners
        setupModalEventListeners();
    }

    // Setup modal event listeners
    function setupModalEventListeners() {
        // Schedule form
        const scheduleForm = document.getElementById('scheduleForm');
        if (scheduleForm) {
            scheduleForm.addEventListener('submit', handleScheduleSubmit);
        }

        // Special day form
        const specialDayForm = document.getElementById('specialDayForm');
        if (specialDayForm) {
            specialDayForm.addEventListener('submit', handleSpecialDaySubmit);
        }

        // Special day all day checkbox
        const specialDayAllDay = document.getElementById('specialDayAllDay');
        if (specialDayAllDay) {
            specialDayAllDay.addEventListener('change', function() {
                const timeRow = document.getElementById('specialDayTimeRow');
                if (this.checked) {
                    timeRow.style.display = 'none';
                } else {
                    timeRow.style.display = 'flex';
                }
            });
        }

        // Schedule break checkbox
        const scheduleHasBreak = document.getElementById('scheduleHasBreak');
        if (scheduleHasBreak) {
            scheduleHasBreak.addEventListener('change', function() {
                const breakInputs = document.querySelectorAll('#scheduleBreakStart, #scheduleBreakEnd');
                breakInputs.forEach(input => {
                    input.disabled = !this.checked;
                });
            });
        }
    }

    // Handle schedule form submit
    async function handleScheduleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            dia_semana: document.getElementById('scheduleDay').value,
            hora_inicio: document.getElementById('scheduleStart').value,
            hora_fin: document.getElementById('scheduleEnd').value,
            pausa_inicio: document.getElementById('scheduleHasBreak').checked ? document.getElementById('scheduleBreakStart').value : null,
            pausa_fin: document.getElementById('scheduleHasBreak').checked ? document.getElementById('scheduleBreakEnd').value : null,
            estado: document.getElementById('scheduleStatus').value
        };

        try {
            const response = await fetch('/api/schedule/working-hours', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    showSuccessMessage('Horario guardado exitosamente');
                    closeModal();
                    // Recargar datos
                    await loadWorkingHours();
                    renderWorkingHours();
                    renderWeeklyOverview();
                } else {
                    throw new Error(result.message);
                }
            } else {
                throw new Error('Error guardando horario');
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            showErrorMessage('Error guardando el horario');
        }
    }

    // Handle special day form submit
    async function handleSpecialDaySubmit(e) {
        e.preventDefault();
        
        const formData = {
            fecha: document.getElementById('specialDayDate').value,
            tipo: document.getElementById('specialDayType').value,
            descripcion: document.getElementById('specialDayTitle').value,
            todo_dia: document.getElementById('specialDayAllDay').checked,
            hora_inicio: document.getElementById('specialDayAllDay').checked ? null : document.getElementById('specialDayStart').value,
            hora_fin: document.getElementById('specialDayAllDay').checked ? null : document.getElementById('specialDayEnd').value
        };

        try {
            const response = await fetch('/api/schedule/special-days', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    showSuccessMessage('Día especial guardado exitosamente');
                    closeModal();
                    // Recargar datos
                    await loadSpecialDays();
                    renderSpecialDays();
                } else {
                    throw new Error(result.message);
                }
            } else {
                throw new Error('Error guardando día especial');
            }
        } catch (error) {
            console.error('Error saving special day:', error);
            showErrorMessage('Error guardando el día especial');
        }
    }

    // Confirm delete schedule
    async function confirmDeleteSchedule(scheduleId) {
        if (confirm('¿Estás seguro de que quieres eliminar este horario?')) {
            try {
                const response = await fetch(`/api/schedule/working-hours/${scheduleId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        showSuccessMessage('Horario eliminado exitosamente');
                        // Recargar datos
                        await loadWorkingHours();
                        renderWorkingHours();
                        renderWeeklyOverview();
                    } else {
                        throw new Error(result.message);
                    }
                } else {
                    throw new Error('Error eliminando horario');
                }
            } catch (error) {
                console.error('Error deleting schedule:', error);
                showErrorMessage('Error eliminando el horario');
            }
        }
    }

    // Confirm delete special day
    async function confirmDeleteSpecialDay(specialDayId) {
        if (confirm('¿Estás seguro de que quieres eliminar este día especial?')) {
            try {
                const response = await fetch(`/api/schedule/special-days/${specialDayId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        showSuccessMessage('Día especial eliminado exitosamente');
                        // Recargar datos
                        await loadSpecialDays();
                        renderSpecialDays();
                    } else {
                        throw new Error(result.message);
                    }
                } else {
                    throw new Error('Error eliminando día especial');
                }
            } catch (error) {
                console.error('Error deleting special day:', error);
                showErrorMessage('Error eliminando el día especial');
            }
        }
    }

    // Close modal
    function closeModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('scheduleModal'));
        if (modal) {
            modal.hide();
        }
    }

    // Show success message
    function showSuccessMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
        `;
        
        const container = document.querySelector('.container-fluid');
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Show error message
    function showErrorMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
        `;
        
        const container = document.querySelector('.container-fluid');
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}); 