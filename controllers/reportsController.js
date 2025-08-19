const db = require('../config/db');
const { format } = require('date-fns');
const { api } = require('../config/simple-logger');

class ReportsController {
    // Obtener reporte general con filtros por período
    static async getGeneralReport(req, res) {
        try {
            const { period, startDate, endDate } = req.query;
            
            api('Generando reporte para período:', period, { startDate, endDate });
            
            // Determinar fechas según el período
            const { start, end } = ReportsController.calculateDateRange(period, startDate, endDate);
            
            // Obtener métricas del período
            const metrics = await ReportsController.getMetricsForPeriod(start, end);
            
            // Obtener datos para gráficos
            const charts = await ReportsController.getChartData(start, end);
            
            // Obtener datos para tablas
            const tables = await ReportsController.getTableData(start, end);
            
            res.json({
                success: true,
                data: {
                    period: { start, end, label: ReportsController.getPeriodLabel(period) },
                    metrics,
                    charts,
                    tables
                }
            });
            
        } catch (error) {
            console.error('❌ Error generando reporte:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
    
    // Calcular rango de fechas según el período
    static calculateDateRange(period, startDate, endDate) {
        const now = new Date();
        let start, end;
        
        switch (period) {
            case 'today':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
                
            case 'yesterday':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
                
            case 'week':
                const dayOfWeek = now.getDay();
                const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
                end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
                break;
                
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
                
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                end = new Date(now.getFullYear(), (quarter + 1) * 3, 1);
                break;
                
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear() + 1, 0, 1);
                break;
                
            case 'custom':
                start = new Date(startDate);
                end = new Date(endDate);
                end.setDate(end.getDate() + 1); // Incluir el día completo
                break;
                
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
        
        return { start, end };
    }
    
    // Obtener etiqueta del período
    static getPeriodLabel(period) {
        const labels = {
            today: 'Hoy',
            yesterday: 'Ayer',
            week: 'Esta Semana',
            month: 'Este Mes',
            quarter: 'Este Trimestre',
            year: 'Este Año',
            custom: 'Período Personalizado'
        };
        return labels[period] || 'Período';
    }
    
    // Obtener métricas para el período
    static async getMetricsForPeriod(start, end) {
        try {
            const startStr = start.toISOString().slice(0, 19).replace('T', ' ');
            const endStr = end.toISOString().slice(0, 19).replace('T', ' ');
            
            // Consulta para métricas básicas - SOLO turnos facturados/completados
            const metricsResult = await db.query(`
                SELECT 
                    COUNT(CASE WHEN estado = 'completado' THEN 1 END) as totalTurnos,
                    SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completedTurnos,
                    SUM(CASE WHEN estado IN ('reservado', 'en_proceso') THEN 1 ELSE 0 END) as pendingTurnos,
                    SUM(CASE WHEN estado = 'completado' THEN precio_final ELSE 0 END) as totalRevenue,
                    COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelledTurnos,
                    COUNT(CASE WHEN estado = 'no_show' THEN 1 END) as noShowTurnos
                FROM turnos 
                WHERE CONCAT(fecha, ' ', hora_inicio) >= ? AND CONCAT(fecha, ' ', hora_inicio) < ?
                AND estado NOT IN ('cancelado', 'no_show')
            `, [startStr, endStr]);
            
            const metrics = metricsResult[0];
            
            // Calcular métricas derivadas importantes para el negocio
            const totalRevenue = metrics.totalRevenue || 0;
            const completedTurnos = metrics.completedTurnos || 0;
            const pendingTurnos = metrics.pendingTurnos || 0;
            const cancelledTurnos = metrics.cancelledTurnos || 0;
            const noShowTurnos = metrics.noShowTurnos || 0;
            
            // Métricas de rentabilidad y eficiencia
            const promedioPorTurno = completedTurnos > 0 ? totalRevenue / completedTurnos : 0;
            const tasaCompletado = (completedTurnos + pendingTurnos) > 0 ? 
                (completedTurnos / (completedTurnos + pendingTurnos)) * 100 : 0;
            const tasaCancelacion = (completedTurnos + pendingTurnos + cancelledTurnos) > 0 ? 
                (cancelledTurnos / (completedTurnos + pendingTurnos + cancelledTurnos)) * 100 : 0;
            
            // Calcular ingresos por hora (asumiendo turnos de 45 min promedio)
            const horasTrabajadas = completedTurnos * 0.75; // 45 min = 0.75 horas
            const ingresosPorHora = horasTrabajadas > 0 ? totalRevenue / horasTrabajadas : 0;
            
            return {
                // Métricas básicas
                totalTurnos: completedTurnos,
                completedTurnos: completedTurnos,
                pendingTurnos: pendingTurnos,
                totalRevenue: totalRevenue,
                
                // Métricas de rentabilidad
                promedioPorTurno: promedioPorTurno,
                ingresosPorHora: ingresosPorHora,
                
                // Métricas de eficiencia
                tasaCompletado: Math.round(tasaCompletado * 100) / 100,
                tasaCancelacion: Math.round(tasaCancelacion * 100) / 100,
                
                // Métricas de calidad
                turnosCancelados: cancelledTurnos,
                noShows: noShowTurnos
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo métricas:', error);
            return {
                totalTurnos: 0,
                completedTurnos: 0,
                pendingTurnos: 0,
                totalRevenue: 0,
                promedioPorTurno: 0,
                ingresosPorHora: 0,
                tasaCompletado: 0,
                tasaCancelacion: 0,
                turnosCancelados: 0,
                noShows: 0
            };
        }
    }
    
    // Obtener datos para gráficos
    static async getChartData(start, end) {
        try {
            const startStr = start.toISOString().slice(0, 19).replace('T', ' ');
            const endStr = end.toISOString().slice(0, 19).replace('T', ' ');
            
            // Datos para gráfico de ingresos por período - SOLO turnos facturados
            const revenueData = await db.query(`
                SELECT 
                    fecha,
                    SUM(CASE WHEN estado = 'completado' THEN precio_final ELSE 0 END) as ingresos,
                    COUNT(CASE WHEN estado = 'completado' THEN 1 END) as turnos
                FROM turnos 
                WHERE CONCAT(fecha, ' ', hora_inicio) >= ? AND CONCAT(fecha, ' ', hora_inicio) < ?
                AND estado NOT IN ('cancelado', 'no_show')
                GROUP BY fecha
                ORDER BY fecha
            `, [startStr, endStr]);
            
            // Datos para distribución de turnos (simplificado y más claro)
            const turnosData = await db.query(`
                SELECT 
                    CASE 
                        WHEN estado = 'completado' THEN 'Completados'
                        WHEN estado = 'reservado' THEN 'Reservados'
                        WHEN estado = 'en_proceso' THEN 'En Proceso'
                        WHEN estado = 'confirmado' THEN 'Confirmados'
                        ELSE estado
                    END as estado_mostrar,
                    COUNT(*) as cantidad
                FROM turnos 
                WHERE CONCAT(fecha, ' ', hora_inicio) >= ? AND CONCAT(fecha, ' ', hora_inicio) < ?
                AND estado NOT IN ('cancelado', 'no_show')
                GROUP BY estado
                ORDER BY 
                    CASE 
                        WHEN estado = 'completado' THEN 1
                        WHEN estado = 'confirmado' THEN 2
                        WHEN estado = 'en_proceso' THEN 3
                        WHEN estado = 'reservado' THEN 4
                        ELSE 5
                    END
            `, [startStr, endStr]);
            
            // Datos para evolución semanal (más útil que mensual para un barbero)
            const weeklyData = await db.query(`
                SELECT 
                    YEARWEEK(fecha) as semana,
                    MIN(fecha) as fecha_inicio,
                    SUM(CASE WHEN estado = 'completado' THEN precio_final ELSE 0 END) as ingresos,
                    COUNT(CASE WHEN estado = 'completado' THEN 1 END) as turnos
                FROM turnos 
                WHERE CONCAT(fecha, ' ', hora_inicio) >= ? AND CONCAT(fecha, ' ', hora_inicio) < ?
                AND estado NOT IN ('cancelado', 'no_show')
                GROUP BY YEARWEEK(fecha)
                ORDER BY semana
                LIMIT 8
            `, [startStr, endStr]);
            
            // Calcular tendencias y insights
            const insights = await ReportsController.calculateInsights(revenueData, start, end);
            
            return {
                revenueByPeriod: {
                    labels: revenueData.map(row => format(new Date(row.fecha), 'dd/MM')),
                    data: revenueData.map(row => row.ingresos || 0),
                    turnos: revenueData.map(row => row.turnos || 0)
                },
                turnosDistribution: {
                    labels: turnosData.map(row => row.estado_mostrar),
                    data: turnosData.map(row => row.cantidad || 0)
                },
                weeklyEvolution: {
                    labels: weeklyData.map(row => `Sem ${format(new Date(row.fecha_inicio), 'dd/MM')}`),
                    revenue: weeklyData.map(row => row.ingresos || 0),
                    turnos: weeklyData.map(row => row.turnos || 0)
                },
                insights: insights
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo datos de gráficos:', error);
            return {
                revenueByPeriod: { labels: [], data: [], turnos: [] },
                turnosDistribution: { labels: [], data: [] },
                weeklyEvolution: { labels: [], revenue: [], turnos: [] },
                insights: {}
            };
        }
    }
    
    // Calcular insights y tendencias del negocio
    static async calculateInsights(revenueData, start, end) {
        try {
            if (!revenueData || revenueData.length === 0) {
                return {
                    tendencia: 'neutral',
                    mensaje: 'No hay datos suficientes para analizar',
                    recomendacion: 'Continúa registrando turnos para obtener insights'
                };
            }
            
            // Calcular tendencia de ingresos
            const ingresos = revenueData.map(row => row.ingresos || 0);
            const totalIngresos = ingresos.reduce((sum, ingreso) => sum + ingreso, 0);
            const promedioIngresos = totalIngresos / ingresos.length;
            
            // Calcular tendencia (comparar primera mitad vs segunda mitad del período)
            const mitad = Math.floor(ingresos.length / 2);
            const primeraMitad = ingresos.slice(0, mitad);
            const segundaMitad = ingresos.slice(mitad);
            
            const promedioPrimeraMitad = primeraMitad.reduce((sum, ingreso) => sum + ingreso, 0) / primeraMitad.length;
            const promedioSegundaMitad = segundaMitad.reduce((sum, ingreso) => sum + ingreso, 0) / segundaMitad.length;
            
            let tendencia = 'neutral';
            let mensaje = '';
            let recomendacion = '';
            
            if (promedioSegundaMitad > promedioPrimeraMitad * 1.1) {
                tendencia = 'creciendo';
                mensaje = '¡Excelente! Tus ingresos están creciendo';
                recomendacion = 'Mantén la calidad del servicio y considera aumentar precios gradualmente';
            } else if (promedioSegundaMitad < promedioPrimeraMitad * 0.9) {
                tendencia = 'decreciendo';
                mensaje = 'Atención: Los ingresos han disminuido';
                recomendacion = 'Revisa tu estrategia de precios y promociones';
            } else {
                tendencia = 'estable';
                mensaje = 'Tus ingresos se mantienen estables';
                recomendacion = 'Considera estrategias para aumentar la demanda';
            }
            
            // Calcular días más rentables
            const diasRentables = revenueData
                .filter(row => (row.ingresos || 0) > promedioIngresos)
                .map(row => format(new Date(row.fecha), 'EEEE'))
                .reduce((acc, dia) => {
                    acc[dia] = (acc[dia] || 0) + 1;
                    return acc;
                }, {});
            
            const diaMasRentable = Object.entries(diasRentables)
                .sort(([,a], [,b]) => b - a)[0];
            
            return {
                tendencia: tendencia,
                mensaje: mensaje,
                recomendacion: recomendacion,
                promedioIngresos: promedioIngresos,
                diaMasRentable: diaMasRentable ? diaMasRentable[0] : 'No disponible',
                totalIngresos: totalIngresos,
                diasAnalizados: ingresos.length
            };
            
        } catch (error) {
            console.error('❌ Error calculando insights:', error);
            return {
                tendencia: 'neutral',
                mensaje: 'Error al calcular insights',
                recomendacion: 'Contacta al soporte técnico'
            };
        }
    }
    
    // Obtener datos para tablas
    static async getTableData(start, end) {
        try {
            const startStr = start.toISOString().slice(0, 19).replace('T', ' ');
            const endStr = end.toISOString().slice(0, 19).replace('T', ' ');
            
            // Top clientes del período - SOLO turnos facturados
            const topClients = await db.query(`
                SELECT 
                    c.nombre,
                    COUNT(CASE WHEN t.estado = 'completado' THEN t.id END) as visitas,
                    SUM(CASE WHEN t.estado = 'completado' THEN t.precio_final ELSE 0 END) as total_gastado
                FROM turnos t
                JOIN clientes c ON t.id_cliente = c.id
                WHERE CONCAT(t.fecha, ' ', t.hora_inicio) >= ? AND CONCAT(t.fecha, ' ', t.hora_inicio) < ?
                AND t.estado NOT IN ('cancelado', 'no_show')
                GROUP BY c.id, c.nombre
                ORDER BY total_gastado DESC
                LIMIT 5
            `, [startStr, endStr]);
            
            // Top servicios del período - SOLO turnos facturados
            const topServices = await db.query(`
                SELECT 
                    s.nombre,
                    COUNT(CASE WHEN t.estado = 'completado' THEN t.id END) as turnos,
                    SUM(CASE WHEN t.estado = 'completado' THEN t.precio_final ELSE 0 END) as ingresos
                FROM turnos t
                JOIN servicios s ON t.id_servicio = s.id
                WHERE CONCAT(t.fecha, ' ', t.hora_inicio) >= ? AND CONCAT(t.fecha, ' ', t.hora_inicio) < ?
                AND t.estado NOT IN ('cancelado', 'no_show')
                GROUP BY s.id, s.nombre
                ORDER BY ingresos DESC
                LIMIT 5
            `, [startStr, endStr]);
            
            return {
                topClients,
                topServices
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo datos de tablas:', error);
            return {
                topClients: [],
                topServices: []
            };
        }
    }
    
    // Obtener etiqueta de estado
    static getStatusLabel(estado) {
        const labels = {
            'reservado': 'Reservado',
            'confirmado': 'Confirmado',
            'en_proceso': 'En Proceso',
            'completado': 'Completado',
            'cancelado': 'Cancelado'
        };
        return labels[estado] || estado;
    }
    
    // Obtener etiqueta de mes
    static getMonthLabel(mes) {
        const meses = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];
        return meses[mes - 1] || mes;
    }
}

module.exports = ReportsController; 