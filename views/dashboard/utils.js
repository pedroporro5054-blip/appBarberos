// Utilidades compartidas para el dashboard
// Funciones de formato de números y otros helpers

/**
 * Formatea números grandes con separadores de miles (formato argentino)
 * @param {number|string} number - Número a formatear
 * @returns {string} Número formateado con separadores de miles
 */
function formatLargeNumber(number) {
    if (number === null || number === undefined) return '0';
    
    // Convertir a número si es string
    const num = typeof number === 'string' ? parseFloat(number) : number;
    
    if (isNaN(num)) return '0';
    
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true
    }).format(num);
}

/**
 * Formatea precios con separadores de miles y 2 decimales
 * @param {number|string} price - Precio a formatear
 * @returns {string} Precio formateado con separadores de miles
 */
function formatPrice(price) {
    if (price === null || price === undefined) return '$0,00';
    
    // Convertir a número si es string
    const num = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(num)) return '$0,00';
    
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
    }).format(num);
}

/**
 * Formatea números con separadores de miles (sin decimales)
 * @param {number|string} number - Número a formatear
 * @returns {string} Número formateado con separadores de miles
 */
function formatNumber(number) {
    return formatLargeNumber(number);
}

/**
 * Formatea porcentajes con separadores de miles
 * @param {number|string} percentage - Porcentaje a formatear
 * @returns {string} Porcentaje formateado
 */
function formatPercentage(percentage) {
    if (percentage === null || percentage === undefined) return '0%';
    
    const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    
    if (isNaN(num)) return '0%';
    
    return `${formatLargeNumber(num)}%`;
}

/**
 * Formatea fechas en formato argentino
 * @param {string} dateString - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Formatea horas en formato 24h
 * @param {string} timeString - Hora a formatear
 * @returns {string} Hora formateada
 */
function formatTime(timeString) {
    if (!timeString) return 'N/A';
    return timeString;
}

// Exportar funciones para uso global
window.formatLargeNumber = formatLargeNumber;
window.formatPrice = formatPrice;
window.formatNumber = formatNumber;
window.formatPercentage = formatPercentage;
window.formatDate = formatDate;
window.formatTime = formatTime;
