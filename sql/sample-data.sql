-- =====================================================
-- DATOS DE EJEMPLO PARA SISTEMA DE GESTIÓN DE BARBERÍA
-- =====================================================

-- Insertar usuario administrador
INSERT INTO usuarios (nombre, apellido, email, telefono, password, descripcion, rol) VALUES 
('Admin', 'Sistema', 'admin@barberia.com', '123-456-7890', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', 'Usuario administrador del sistema', 'admin');

-- Insertar barbero de ejemplo
INSERT INTO usuarios (nombre, apellido, email, telefono, password, descripcion, rol) VALUES 
('Alexis', 'Allendez', 'alexis@barberia.com', '+54 9 11 1234-5678', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', 'Barbero profesional con más de 10 años de experiencia', 'barbero');

-- Insertar servicios de ejemplo
INSERT INTO servicios (nombre, descripcion, duracion, precio, id_usuario) VALUES 
('Corte Clásico', 'Corte tradicional con acabado perfecto', 30, 25.00, 2),
('Barba', 'Arreglo y modelado de barba', 20, 20.00, 2),
('Corte + Barba', 'Combo completo de corte y barba', 45, 40.00, 2),
('Coloración', 'Coloración profesional', 60, 45.00, 2),
('Tratamiento', 'Tratamientos capilares', 45, 35.00, 2),
('Tratamiento Premium', 'Experiencia completa con masaje', 90, 60.00, 2);

-- Insertar horarios de ejemplo (lunes a sábado)
INSERT INTO horarios_laborales (id_usuario, dia_semana, hora_inicio, hora_fin, pausa_inicio, pausa_fin) VALUES 
(2, 'lunes', '09:00:00', '18:00:00', '13:00:00', '14:00:00'),
(2, 'martes', '09:00:00', '18:00:00', '13:00:00', '14:00:00'),
(2, 'miercoles', '09:00:00', '18:00:00', '13:00:00', '14:00:00'),
(2, 'jueves', '09:00:00', '18:00:00', '13:00:00', '14:00:00'),
(2, 'viernes', '09:00:00', '18:00:00', '13:00:00', '14:00:00'),
(2, 'sabado', '09:00:00', '16:00:00', NULL, NULL);

-- Insertar configuración por defecto
INSERT INTO configuracion_barbero (id_usuario) VALUES (2);

-- Insertar cliente de ejemplo
INSERT INTO clientes (nombre, apellido, email, telefono) VALUES 
('Juan', 'Pérez', 'juan.perez@email.com', '123-456-7890'); 