-- =====================================================
-- SCHEMA COMPLETO PARA SISTEMA DE GESTIÓN DE BARBERÍA
-- =====================================================

-- 1. Tabla de barberos (usuarios del sistema)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  nombre_barberia VARCHAR(100),
  direccion VARCHAR(200),
  password VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  descripcion TEXT,
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  rol ENUM('admin', 'barbero') DEFAULT 'barbero',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuarios_email (email),
  INDEX idx_usuarios_rol (rol),
  INDEX idx_usuarios_estado (estado)
);

-- 2. Tabla de servicios ofrecidos por cada barbero
CREATE TABLE IF NOT EXISTS servicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  precio_anterior DECIMAL(10,2),
  duracion INT NOT NULL DEFAULT 30 COMMENT 'Duración del servicio en minutos',
  id_usuario INT NOT NULL,
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3. Tabla de clientes que reservan turnos
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  telefono VARCHAR(20) NOT NULL,
  fecha_nacimiento DATE,
  notas TEXT,
  total_visitas INT DEFAULT 0,
  ultima_visita TIMESTAMP NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Tabla de turnos reservados
CREATE TABLE IF NOT EXISTS turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  id_cliente INT NOT NULL,
  id_usuario INT NOT NULL,
  id_servicio INT NOT NULL,
  precio_final DECIMAL(10,2) NOT NULL,
  codigo_cancelacion VARCHAR(10) UNIQUE,
  estado ENUM('reservado', 'confirmado', 'en_proceso', 'completado', 'cancelado', 'no_show') DEFAULT 'reservado',
  notas TEXT,
  metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'otro') DEFAULT 'efectivo',
  pagado BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_servicio) REFERENCES servicios(id) ON DELETE CASCADE
);

-- 5. Horarios laborales configurables por el barbero
CREATE TABLE IF NOT EXISTS horarios_laborales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  dia_semana ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  pausa_inicio TIME NULL,
  pausa_fin TIME NULL,
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_horario (id_usuario, dia_semana)
);

-- 6. Tabla de días festivos/vacaciones
CREATE TABLE IF NOT EXISTS dias_especiales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  fecha DATE NOT NULL,
  tipo ENUM('vacaciones', 'feriado', 'enfermedad', 'otro') NOT NULL,
  descripcion TEXT,
  todo_dia BOOLEAN DEFAULT TRUE,
  hora_inicio TIME NULL,
  hora_fin TIME NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 7. Tabla de métricas y estadísticas
CREATE TABLE IF NOT EXISTS metricas_diarias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  fecha DATE NOT NULL,
  total_turnos INT DEFAULT 0,
  turnos_completados INT DEFAULT 0,
  turnos_cancelados INT DEFAULT 0,
  total_recaudado DECIMAL(10,2) DEFAULT 0.00,
  tiempo_trabajado INT DEFAULT 0,
  clientes_nuevos INT DEFAULT 0,
  clientes_recurrentes INT DEFAULT 0,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_metrica (id_usuario, fecha)
);

-- 8. Tabla de configuración general del barbero
CREATE TABLE IF NOT EXISTS configuracion_barbero (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL UNIQUE,
  intervalo_turnos INT DEFAULT 30,
  anticipacion_reserva INT DEFAULT 1440,
  max_reservas_dia INT DEFAULT 20,
  permitir_reservas_mismo_dia BOOLEAN DEFAULT TRUE,
  mostrar_precios BOOLEAN DEFAULT TRUE,
  notificaciones_email BOOLEAN DEFAULT TRUE,
  notificaciones_sms BOOLEAN DEFAULT FALSE,
  moneda VARCHAR(10) DEFAULT 'ARS',
  zona_horaria VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 9. Tabla de historial de cambios de precios
CREATE TABLE IF NOT EXISTS historial_precios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_servicio INT NOT NULL,
  precio_anterior DECIMAL(10,2) NOT NULL,
  precio_nuevo DECIMAL(10,2) NOT NULL,
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  motivo TEXT,
  FOREIGN KEY (id_servicio) REFERENCES servicios(id) ON DELETE CASCADE
);

-- 10. Tabla de promociones y descuentos
CREATE TABLE IF NOT EXISTS promociones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo ENUM('porcentaje', 'monto_fijo') NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_semana VARCHAR(20),
  servicios_aplicables TEXT,
  estado ENUM('activa', 'inactiva') DEFAULT 'activa',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 11. Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_turno INT NULL,
  tipo ENUM('reserva', 'recordatorio', 'cancelacion', 'sistema') NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_turno) REFERENCES turnos(id) ON DELETE SET NULL
);

-- 12. Tabla de logs de actividad
CREATE TABLE IF NOT EXISTS logs_actividad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NULL,
  accion VARCHAR(100) NOT NULL,
  tabla_afectada VARCHAR(50),
  id_registro INT,
  datos_anteriores JSON,
  datos_nuevos JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL
); 