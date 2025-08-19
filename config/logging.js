// Sistema de configuración de logs
const LOG_LEVELS = {
    ERROR: 0,    // Solo errores críticos
    WARN: 1,     // Advertencias y errores
    INFO: 2,     // Información básica
    DEBUG: 3,    // Información detallada para desarrollo
    VERBOSE: 4   // Todo tipo de información
};

// Configuración por defecto
const DEFAULT_CONFIG = {
    level: process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.INFO,
    showEmojis: process.env.NODE_ENV !== 'production',
    showTimestamps: process.env.NODE_ENV === 'production',
    showDebugInfo: process.env.NODE_ENV === 'development'
};

class Logger {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.level = this.config.level;
    }

    // Función para verificar si un nivel debe mostrarse
    shouldLog(level) {
        return level <= this.level;
    }

    // Función para formatear timestamp
    formatTimestamp() {
        if (!this.config.showTimestamps) return '';
        return `[${new Date().toISOString()}] `;
    }

    // Función para formatear emoji
    formatEmoji(emoji) {
        if (!this.config.showEmojis) return '';
        return emoji + ' ';
    }

    // Log de error (siempre visible)
    error(message, ...args) {
        if (this.shouldLog(LOG_LEVELS.ERROR)) {
            console.error(this.formatTimestamp() + this.formatEmoji('❌') + message, ...args);
        }
    }

    // Log de advertencia
    warn(message, ...args) {
        if (this.shouldLog(LOG_LEVELS.WARN)) {
            console.warn(this.formatTimestamp() + this.formatEmoji('⚠️') + message, ...args);
        }
    }

    // Log de información
    info(message, ...args) {
        if (this.shouldLog(LOG_LEVELS.INFO)) {
            console.log(this.formatTimestamp() + this.formatEmoji('ℹ️') + message, ...args);
        }
    }

    // Log de debug
    debug(message, ...args) {
        if (this.shouldLog(LOG_LEVELS.DEBUG)) {
            console.log(this.formatTimestamp() + this.formatEmoji('🔍') + message, ...args);
        }
    }

    // Log de estadísticas (solo en desarrollo)
    stats(message, ...args) {
        if (this.config.showDebugInfo && this.shouldLog(LOG_LEVELS.DEBUG)) {
            console.log(this.formatTimestamp() + this.formatEmoji('📊') + message, ...args);
        }
    }

    // Log de éxito
    success(message, ...args) {
        if (this.shouldLog(LOG_LEVELS.INFO)) {
            console.log(this.formatTimestamp() + this.formatEmoji('✅') + message, ...args);
        }
    }

    // Log de inicio
    start(message, ...args) {
        if (this.shouldLog(LOG_LEVELS.INFO)) {
            console.log(this.formatTimestamp() + this.formatEmoji('🚀') + message, ...args);
        }
    }

    // Log de base de datos
    db(message, ...args) {
        if (this.config.showDebugInfo && this.shouldLog(LOG_LEVELS.DEBUG)) {
            console.log(this.formatTimestamp() + this.formatEmoji('🗄️') + message, ...args);
        }
    }

    // Log de API
    api(message, ...args) {
        if (this.config.showDebugInfo && this.shouldLog(LOG_LEVELS.DEBUG)) {
            console.log(this.formatTimestamp() + this.formatEmoji('🌐') + message, ...args);
        }
    }

    // Función para cambiar el nivel de log dinámicamente
    setLevel(level) {
        this.level = level;
        this.info(`Nivel de log cambiado a: ${this.getLevelName(level)}`);
    }

    // Función para obtener el nombre del nivel
    getLevelName(level) {
        const names = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'VERBOSE'];
        return names[level] || 'UNKNOWN';
    }

    // Función para mostrar configuración actual
    showConfig() {
        this.info('Configuración de logs:');
        this.info(`  Nivel: ${this.getLevelName(this.level)}`);
        this.info(`  Emojis: ${this.config.showEmojis ? 'Activados' : 'Desactivados'}`);
        this.info(`  Timestamps: ${this.config.showTimestamps ? 'Activados' : 'Desactivados'}`);
        this.info(`  Debug: ${this.config.showDebugInfo ? 'Activado' : 'Desactivado'}`);
    }
}

// Crear instancia global del logger
const logger = new Logger();

// Función para configurar el logger desde variables de entorno
function configureLogger() {
    const envLevel = process.env.LOG_LEVEL;
    if (envLevel) {
        const level = parseInt(envLevel);
        if (!isNaN(level) && level >= 0 && level <= 4) {
            logger.setLevel(level);
        }
    }

    // Mostrar configuración al inicio
    logger.showConfig();
}

// Exportar logger y función de configuración
module.exports = {
    logger,
    configureLogger,
    LOG_LEVELS
};
