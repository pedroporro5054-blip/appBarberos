-- =====================================================
-- MIGRACIÓN: Agregar campo duracion a servicios
-- =====================================================

-- Agregar campo duracion a la tabla servicios si no existe
ALTER TABLE servicios 
ADD COLUMN IF NOT EXISTS duracion INT NOT NULL DEFAULT 30 COMMENT 'Duración del servicio en minutos';

-- Actualizar servicios existentes con duraciones típicas
UPDATE servicios SET duracion = 30 WHERE nombre LIKE '%corte%' AND nombre NOT LIKE '%barba%';
UPDATE servicios SET duracion = 60 WHERE nombre LIKE '%barba%' OR nombre LIKE '%completo%';
UPDATE servicios SET duracion = 45 WHERE nombre LIKE '%corte%' AND nombre LIKE '%barba%';
UPDATE servicios SET duracion = 20 WHERE nombre LIKE '%peinado%' OR nombre LIKE '%arreglo%';
UPDATE servicios SET duracion = 15 WHERE nombre LIKE '%arreglo%' OR nombre LIKE '%tinte%';

-- Verificar que todos los servicios tengan duración
SELECT id, nombre, duracion FROM servicios ORDER BY id; 