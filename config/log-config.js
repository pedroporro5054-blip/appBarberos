// Configuración de logs para controlar la salida en terminal
module.exports = {
    // Nivel de logs (0=ERROR, 1=WARN, 2=INFO, 3=DEBUG, 4=VERBOSE)
    LOG_LEVEL: process.env.LOG_LEVEL || 1,
    
    // Configuraciones específicas
    SHOW_STATS_LOGS: process.env.SHOW_STATS_LOGS === 'true' || false,
    SHOW_DEBUG_LOGS: process.env.SHOW_DEBUG_LOGS === 'true' || false,
    SHOW_API_LOGS: process.env.SHOW_API_LOGS === 'true' || false,
    
    // Configuración por entorno
    PRODUCTION: {
        LOG_LEVEL: 1,  // Solo WARN y ERROR
        SHOW_STATS_LOGS: false,
        SHOW_DEBUG_LOGS: false,
        SHOW_API_LOGS: false
    },
    
    DEVELOPMENT: {
        LOG_LEVEL: 2,  // INFO, WARN y ERROR
        SHOW_STATS_LOGS: false,  // Desactivado por defecto
        SHOW_DEBUG_LOGS: false,  // Desactivado por defecto
        SHOW_API_LOGS: false     // Desactivado por defecto
    },
    
    // Función para obtener configuración según el entorno
    getConfig() {
        const env = process.env.NODE_ENV || 'development';
        const baseConfig = env === 'production' ? this.PRODUCTION : this.DEVELOPMENT;
        
        return {
            LOG_LEVEL: process.env.LOG_LEVEL || baseConfig.LOG_LEVEL,
            SHOW_STATS_LOGS: this.SHOW_STATS_LOGS || baseConfig.SHOW_STATS_LOGS,
            SHOW_DEBUG_LOGS: this.SHOW_DEBUG_LOGS || baseConfig.SHOW_DEBUG_LOGS,
            SHOW_API_LOGS: this.SHOW_API_LOGS || baseConfig.SHOW_API_LOGS
        };
    }
};
