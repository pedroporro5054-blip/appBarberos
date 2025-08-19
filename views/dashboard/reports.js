// Reportes con Filtros por Período - Sistema Avanzado
console.log('🚀 Sistema de Reportes Avanzado cargado');

// Variables globales para los gráficos
let revenueChart = null;
let turnosChart = null;
let yearlyChart = null;

// Configuración de períodos
const PERIODS = {
    today: { label: 'Hoy', days: 1, icon: '📅' },
    yesterday: { label: 'Ayer', days: 1, icon: '📆' },
    week: { label: 'Esta Semana', days: 7, icon: '📊' },
    month: { label: 'Este Mes', days: 30, icon: '📈' },
    quarter: { label: 'Este Trimestre', days: 90, icon: '📉' },
    year: { label: 'Este Año', days: 365, icon: '🎯' },
    custom: { label: 'Personalizado', days: null, icon: '⚙️' }
};

// Función principal de inicialización
function inicializarReportes() {
    console.log('📊 Inicializando sistema de reportes...');
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Configurar fechas por defecto
    configurarFechasPorDefecto();
    
    // Cargar reporte inicial
    cargarReporte();
}

// Configurar event listeners
function configurarEventListeners() {
    // Cambio de período
    const reportPeriod = document.getElementById('reportPeriod');
    if (reportPeriod) {
        reportPeriod.addEventListener('change', function() {
            const period = this.value;
            console.log('🔄 Período cambiado a:', period);
            
            // Mostrar/ocultar campos de fecha personalizada
            const customDateRange = document.getElementById('customDateRange');
            const customDateRangeEnd = document.getElementById('customDateRangeEnd');
            
            if (period === 'custom') {
                customDateRange.style.display = 'block';
                customDateRangeEnd.style.display = 'block';
            } else {
                customDateRange.style.display = 'none';
                customDateRangeEnd.style.display = 'none';
            }
            
            // Cargar reporte automáticamente
            cargarReporte();
        });
    }
    
    // Botón de actualizar
    const generateReport = document.getElementById('generateReport');
    if (generateReport) {
        generateReport.addEventListener('click', cargarReporte);
    }
}

// Configurar fechas por defecto
function configurarFechasPorDefecto() {
    const today = new Date();
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (startDate && endDate) {
        // Fecha de inicio: hace 30 días
        const start = new Date(today);
        start.setDate(today.getDate() - 30);
        startDate.value = start.toISOString().split('T')[0];
        
        // Fecha de fin: hoy
        endDate.value = today.toISOString().split('T')[0];
    }
}

// Función principal para cargar reportes
async function cargarReporte() {
    try {
        console.log('📊 Cargando reporte...');
        
        const period = document.getElementById('reportPeriod')?.value || 'month';
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        
        console.log('📅 Período seleccionado:', period);
        console.log('📅 Fechas:', { startDate, endDate });
        
        // Mostrar loading
        mostrarLoading(true);
        
        // Construir parámetros de la petición
        const params = new URLSearchParams({ period });
        if (period === 'custom' && startDate && endDate) {
            params.append('startDate', startDate);
            params.append('endDate', endDate);
        }
        
        // Hacer petición al servidor
        const response = await fetch(`/api/reports/general?${params}`);
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Datos del reporte recibidos:', result.data);
            
            // Actualizar métricas
            actualizarMetricas(result.data.metrics);
            
            // Actualizar gráficos
            actualizarGraficos(result.data.charts);
            
            // Actualizar tablas
            actualizarTablas(result.data.tables);
            
            // Actualizar título del período
            actualizarTituloPeriodo(period);
            
        } else {
            console.error('❌ Error en la respuesta del servidor:', result.message);
            mostrarError('Error al cargar el reporte: ' + result.message);
        }
        
    } catch (error) {
        console.error('❌ Error cargando reporte:', error);
        mostrarError('Error al cargar el reporte. Verifica tu conexión.');
    } finally {
        mostrarLoading(false);
    }
}

// Actualizar métricas principales
function actualizarMetricas(metrics) {
    if (!metrics) {
        console.warn('⚠️ No hay métricas disponibles');
        return;
    }
    
    console.log('📊 Actualizando métricas:', metrics);
    
    // Actualizar elementos de la UI
    actualizarElemento('totalTurnos', metrics.totalTurnos || 0);
    actualizarElemento('completedTurnos', metrics.completedTurnos || 0);
    actualizarElemento('totalIngresos', formatearPrecio(metrics.totalRevenue || 0));
    
    // Calcular y mostrar promedio por turno
    const promedio = metrics.promedioPorTurno || 0;
    actualizarElemento('promedioTurno', formatearPrecio(promedio));
    
    // Actualizar nuevas métricas de rentabilidad
    actualizarElemento('ingresosPorHora', formatearPrecio(metrics.ingresosPorHora || 0));
    actualizarElemento('tasaCompletado', `${metrics.tasaCompletado || 0}%`);
    actualizarElemento('tasaCancelacion', `${metrics.tasaCancelacion || 0}%`);
    
    // Mostrar insights si están disponibles
    if (metrics.insights) {
        mostrarInsights(metrics.insights);
    }
}

// Actualizar gráficos
function actualizarGraficos(charts) {
    if (!charts) {
        console.warn('⚠️ No hay datos de gráficos disponibles');
        return;
    }
    
    console.log('📈 Actualizando gráficos:', charts);
    
    // Gráfico de ingresos por período
    if (charts.revenueByPeriod) {
        actualizarGraficoIngresos(charts.revenueByPeriod);
    }
    
    // Gráfico de distribución de turnos
    if (charts.turnosDistribution) {
        actualizarGraficoTurnos(charts.turnosDistribution);
    }
    
    // Gráfico de evolución semanal
    if (charts.weeklyEvolution) {
        actualizarGraficoSemanal(charts.weeklyEvolution);
    }
}

// Actualizar tablas
function actualizarTablas(tables) {
    if (!tables) {
        console.warn('⚠️ No hay datos de tablas disponibles');
        return;
    }
    
    console.log('📋 Actualizando tablas:', tables);
    
    // Tabla de top clientes
    if (tables.topClients) {
        actualizarTablaClientes(tables.topClients);
    }
    
    // Tabla de top servicios
    if (tables.topServices) {
        actualizarTablaServicios(tables.topServices);
    }
}

// Actualizar gráfico de ingresos
function actualizarGraficoIngresos(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels || [],
            datasets: [{
                label: 'Ingresos',
                data: data.data || [],
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                borderColor: 'rgba(78, 115, 223, 1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Ingresos: ' + formatearPrecio(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatearPrecio(value);
                        }
                    }
                }
            }
        }
    });
}

// Actualizar gráfico de turnos
function actualizarGraficoTurnos(data) {
    const ctx = document.getElementById('turnosChart');
    if (!ctx) return;
    
    if (turnosChart) {
        turnosChart.destroy();
    }
    
    turnosChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels || [],
            datasets: [{
                data: data.data || [],
                backgroundColor: [
                    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true }
                }
            }
        }
    });
}

// Actualizar gráfico semanal
function actualizarGraficoSemanal(data) {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    
    if (yearlyChart) {
        yearlyChart.destroy();
    }
    
    yearlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels || [],
            datasets: [{
                label: 'Ingresos',
                data: data.revenue || [],
                backgroundColor: 'rgba(78, 115, 223, 0.8)',
                borderColor: 'rgba(78, 115, 223, 1)',
                borderWidth: 2,
                yAxisID: 'y'
            }, {
                label: 'Turnos',
                data: data.turnos || [],
                backgroundColor: 'rgba(28, 200, 138, 0.8)',
                borderColor: 'rgba(28, 200, 138, 1)',
                borderWidth: 2,
                yAxisID: 'y1',
                type: 'line'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return 'Ingresos: ' + formatearPrecio(context.parsed.y);
                            } else {
                                return 'Turnos: ' + context.parsed.y;
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Ingresos ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatearPrecio(value);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cantidad de Turnos'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// Actualizar tabla de clientes
function actualizarTablaClientes(clientes) {
    const tbody = document.getElementById('topClientsTable');
    if (!tbody) return;
    
    if (clientes && clientes.length > 0) {
        const filas = clientes.map((cliente, index) => `
            <tr>
                <td><span class="badge bg-primary">${index + 1}</span></td>
                <td><strong>${cliente.nombre || 'Cliente'}</strong></td>
                <td>${cliente.visitas || 0} turnos</td>
                <td class="text-success fw-bold">${formatearPrecio(cliente.total_gastado || 0)}</td>
            </tr>
        `).join('');
        
        tbody.innerHTML = filas;
    } else {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    <i class="fas fa-info-circle me-2"></i>
                    No hay clientes con datos suficientes
                </td>
            </tr>
        `;
    }
}

// Actualizar tabla de servicios
function actualizarTablaServicios(servicios) {
    const tbody = document.getElementById('topServicesTable');
    if (!tbody) return;
    
    if (servicios && servicios.length > 0) {
        const filas = servicios.map((servicio, index) => `
            <tr>
                <td><span class="badge bg-warning">${index + 1}</span></td>
                <td><strong>${servicio.nombre || 'Servicio'}</strong></td>
                <td>${servicio.turnos || 0} turnos</td>
                <td class="text-success fw-bold">${formatearPrecio(servicio.ingresos || 0)}</td>
            </tr>
        `).join('');
        
        tbody.innerHTML = filas;
    } else {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    <i class="fas fa-info-circle me-2"></i>
                    No hay servicios con datos suficientes
                </td>
            </tr>
        `;
    }
}

// Actualizar título del período
function actualizarTituloPeriodo(period) {
    const periodInfo = PERIODS[period];
    if (periodInfo) {
        console.log('📅 Período actualizado:', periodInfo.label);
    }
}

// Función helper para actualizar elementos
function actualizarElemento(elementId, valor) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = valor;
    } else {
        console.warn(`⚠️ Elemento ${elementId} no encontrado`);
    }
}

// Función para mostrar/ocultar loading
function mostrarLoading(mostrar) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        if (mostrar) {
            loadingOverlay.classList.add('show');
        } else {
            loadingOverlay.classList.remove('show');
        }
    }
}

// Función para mostrar errores
function mostrarError(mensaje) {
    console.error('❌ Error:', mensaje);
    
    // Crear notificación de error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    errorDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Error:</strong> ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remover automáticamente después de 5 segundos
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Función para formatear precios
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(precio);
}

// Mostrar insights y recomendaciones del negocio
function mostrarInsights(insights) {
    const insightsContainer = document.getElementById('businessInsights');
    if (!insightsContainer) return;
    
    let iconClass = 'fas fa-chart-line';
    let alertClass = 'alert-info';
    
    // Determinar icono y color según la tendencia
    switch (insights.tendencia) {
        case 'creciendo':
            iconClass = 'fas fa-arrow-up text-success';
            alertClass = 'alert-success';
            break;
        case 'decreciendo':
            iconClass = 'fas fa-arrow-down text-danger';
            alertClass = 'alert-warning';
            break;
        case 'estable':
            iconClass = 'fas fa-minus text-info';
            alertClass = 'alert-info';
            break;
    }
    
    const insightsHTML = `
        <div class="alert ${alertClass} border-0 shadow-sm">
            <div class="d-flex align-items-start">
                <div class="flex-shrink-0 me-3">
                    <i class="${iconClass} fa-2x"></i>
                </div>
                <div class="flex-grow-1">
                    <h6 class="alert-heading mb-2">
                        <i class="fas fa-lightbulb me-2"></i>
                        Análisis de tu Negocio
                    </h6>
                    <p class="mb-2"><strong>${insights.mensaje}</strong></p>
                    <p class="mb-2"><i class="fas fa-lightbulb me-2"></i>${insights.recomendacion}</p>
                    <hr class="my-2">
                    <div class="row text-muted small">
                        <div class="col-md-6">
                            <i class="fas fa-calendar me-1"></i>
                            Día más rentable: <strong>${insights.diaMasRentable}</strong>
                        </div>
                        <div class="col-md-6">
                            <i class="fas fa-chart-bar me-1"></i>
                            Promedio diario: <strong>${formatearPrecio(insights.promedioIngresos)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    insightsContainer.innerHTML = insightsHTML;
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Página cargada, inicializando reportes avanzados...');
    
    // Esperar un poco para que el DOM esté completamente listo
    setTimeout(inicializarReportes, 500);
});

// Inicializar cuando se cambia a la sección de reportes
document.addEventListener('click', function(e) {
    if (e.target.matches('[data-section="reports"]')) {
        console.log('🔄 Cambiando a sección de reportes...');
        setTimeout(inicializarReportes, 100);
    }
});

console.log('✅ Sistema de Reportes Avanzado inicializado correctamente');
