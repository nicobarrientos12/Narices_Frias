-- Database schema for NARICES_FRIAS (based on front-end enums and provided diagram)
-- Charset: utf8mb4 to support accents in ENUM values (e.g., "Vacunación", "En revisión")

CREATE DATABASE IF NOT EXISTS narices_frias
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE narices_frias;

-- =========================
-- 1) usuario
-- =========================
CREATE TABLE IF NOT EXISTS usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(45) NOT NULL,
  primer_apellido VARCHAR(45) NOT NULL,
  segundo_apellido VARCHAR(45) NULL,
  carnet_identidad VARCHAR(25) NULL,
  direccion TEXT NULL,
  latitud DECIMAL(9,6) NULL,
  longitud DECIMAL(9,6) NULL,
  correo VARCHAR(100) NOT NULL,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('Administrador','Veterinario','Voluntario') NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_usuario_correo (correo),
  KEY idx_usuario_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 2) dueno
-- =========================
CREATE TABLE IF NOT EXISTS dueno (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  direccion TEXT NULL,
  telefono VARCHAR(20) NULL,
  correo VARCHAR(100) NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  latitud DECIMAL(9,6) NULL,
  longitud DECIMAL(9,6) NULL,
  KEY idx_dueno_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 3) mascota
-- =========================
CREATE TABLE IF NOT EXISTS mascota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  especie VARCHAR(50) NOT NULL,
  raza VARCHAR(100) NULL,
  edad INT NULL,
  genero ENUM('Macho','Hembra') NULL,
  esterilizado ENUM('Si','No') NULL,
  color VARCHAR(50) NULL,
  caracteristicas TEXT NULL,
  fecha_ingreso DATE NULL,
  estado_llegada ENUM('En refugio','Adoptado','Externo') NOT NULL,
  foto_url TEXT NULL,
  dueno_id INT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_mascota_dueno (dueno_id),
  CONSTRAINT fk_mascota_dueno FOREIGN KEY (dueno_id) REFERENCES dueno(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 4) vacuna
-- =========================
CREATE TABLE IF NOT EXISTS vacuna (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  precio DECIMAL(18,2) NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 5) medicamento
-- =========================
CREATE TABLE IF NOT EXISTS medicamento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(45) NOT NULL,
  descripcion TEXT NULL,
  precio DECIMAL(18,2) NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 6) enfermedad
-- =========================
CREATE TABLE IF NOT EXISTS enfermedad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 7) alergia
-- =========================
CREATE TABLE IF NOT EXISTS alergia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 8) adopcion
-- =========================
CREATE TABLE IF NOT EXISTS adopcion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  dueno_id INT NOT NULL,
  fecha_solicitud DATE NOT NULL,
  fecha_aprobacion DATE NULL,
  estado_llegada ENUM('En revisión','Aprobada','Rechazada') NOT NULL,
  observaciones TEXT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  KEY idx_adopcion_mascota (mascota_id),
  KEY idx_adopcion_dueno (dueno_id),
  KEY idx_adopcion_usuario (usuario_id),
  CONSTRAINT fk_adopcion_mascota FOREIGN KEY (mascota_id) REFERENCES mascota(id),
  CONSTRAINT fk_adopcion_dueno FOREIGN KEY (dueno_id) REFERENCES dueno(id),
  CONSTRAINT fk_adopcion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  CONSTRAINT chk_adopcion_fecha_aprobacion CHECK (
    (estado_llegada = 'Aprobada' AND fecha_aprobacion IS NOT NULL)
    OR
    (estado_llegada IN ('En revisión','Rechazada') AND fecha_aprobacion IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 9) tratamiento
-- =========================
CREATE TABLE IF NOT EXISTS tratamiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  diagnostico TEXT NULL,
  fecha_inicio DATE NULL,
  fecha_fin DATE NULL,
  precio DECIMAL(18,2) NULL,
  observaciones TEXT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  KEY idx_tratamiento_mascota (mascota_id),
  KEY idx_tratamiento_usuario (usuario_id),
  CONSTRAINT fk_tratamiento_mascota FOREIGN KEY (mascota_id) REFERENCES mascota(id),
  CONSTRAINT fk_tratamiento_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 10) cita
-- =========================
CREATE TABLE IF NOT EXISTS cita (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  dueno_id INT NULL,
  usuario_id INT NOT NULL,
  fecha DATETIME NOT NULL,
  motivo TEXT NULL,
  precio DECIMAL(18,2) NULL,
  tipo ENUM('Consulta','Vacunación','Cirugía','Control') NOT NULL,
  observaciones TEXT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cita_mascota (mascota_id),
  KEY idx_cita_dueno (dueno_id),
  KEY idx_cita_usuario (usuario_id),
  CONSTRAINT fk_cita_mascota FOREIGN KEY (mascota_id) REFERENCES mascota(id),
  CONSTRAINT fk_cita_dueno FOREIGN KEY (dueno_id) REFERENCES dueno(id),
  CONSTRAINT fk_cita_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  CONSTRAINT chk_cita_precio CHECK (precio IS NULL OR precio >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 11) campania
-- =========================
CREATE TABLE IF NOT EXISTS campania (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  fecha DATE NULL,
  monto_invertido DECIMAL(18,2) NULL,
  total_recaudado DECIMAL(18,2) NULL,
  ganancia DECIMAL(18,2) NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_campania_usuario (usuario_id),
  CONSTRAINT fk_campania_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 12) donacion
-- =========================
CREATE TABLE IF NOT EXISTS donacion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nombre_donante VARCHAR(150) NULL,
  tipo ENUM('Monetaria','Especie') NOT NULL,
  monto DECIMAL(18,2) NULL,
  descripcion_especie TEXT NULL,
  fecha_donacion DATE NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_donacion_usuario (usuario_id),
  CONSTRAINT fk_donacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  CONSTRAINT chk_donacion_tipo CHECK (
    (tipo = 'Monetaria' AND monto IS NOT NULL AND descripcion_especie IS NULL)
    OR
    (tipo = 'Especie' AND monto IS NULL AND descripcion_especie IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 13) historial_clinico
-- =========================
CREATE TABLE IF NOT EXISTS historial_clinico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  fecha DATETIME NULL,
  descripcion TEXT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  KEY idx_historial_mascota (mascota_id),
  KEY idx_historial_usuario (usuario_id),
  CONSTRAINT fk_historial_mascota FOREIGN KEY (mascota_id) REFERENCES mascota(id),
  CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 14) mascota_vacuna
-- =========================
CREATE TABLE IF NOT EXISTS mascota_vacuna (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  vacuna_id INT NOT NULL,
  fecha_aplicacion DATE NULL,
  proxima_aplicacion DATE NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  KEY idx_mascota_vacuna_mascota (mascota_id),
  KEY idx_mascota_vacuna_vacuna (vacuna_id),
  KEY idx_mascota_vacuna_usuario (usuario_id),
  CONSTRAINT fk_mascota_vacuna_mascota FOREIGN KEY (mascota_id) REFERENCES mascota(id),
  CONSTRAINT fk_mascota_vacuna_vacuna FOREIGN KEY (vacuna_id) REFERENCES vacuna(id),
  CONSTRAINT fk_mascota_vacuna_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 15) tratamiento_medicamento
-- =========================
CREATE TABLE IF NOT EXISTS tratamiento_medicamento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tratamiento_id INT NOT NULL,
  medicamento_id INT NOT NULL,
  dosis VARCHAR(100) NULL,
  frecuencia VARCHAR(100) NULL,
  duracion VARCHAR(100) NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_tratamiento_medicamento_tratamiento (tratamiento_id),
  KEY idx_tratamiento_medicamento_medicamento (medicamento_id),
  CONSTRAINT fk_tratamiento_medicamento_tratamiento FOREIGN KEY (tratamiento_id) REFERENCES tratamiento(id),
  CONSTRAINT fk_tratamiento_medicamento_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamento(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 16) mascota_enfermedad
-- =========================
CREATE TABLE IF NOT EXISTS mascota_enfermedad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  enfermedad_id INT NOT NULL,
  fecha_diagnostico DATE NULL,
  observaciones TEXT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_mascota_enfermedad_mascota (mascota_id),
  KEY idx_mascota_enfermedad_enfermedad (enfermedad_id),
  CONSTRAINT fk_mascota_enfermedad_mascota FOREIGN KEY (mascota_id) REFERENCES mascota(id),
  CONSTRAINT fk_mascota_enfermedad_enfermedad FOREIGN KEY (enfermedad_id) REFERENCES enfermedad(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 17) mascota_alergia
-- =========================
CREATE TABLE IF NOT EXISTS mascota_alergia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  alergia_id INT NOT NULL,
  observaciones TEXT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_mascota_alergia_mascota (mascota_id),
  KEY idx_mascota_alergia_alergia (alergia_id),
  CONSTRAINT fk_mascota_alergia_mascota FOREIGN KEY (mascota_id) REFERENCES mascota(id),
  CONSTRAINT fk_mascota_alergia_alergia FOREIGN KEY (alergia_id) REFERENCES alergia(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 18) seguimiento_postadopcion
-- =========================
CREATE TABLE IF NOT EXISTS seguimiento_postadopcion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adopcion_id INT NOT NULL,
  fecha DATE NULL,
  observaciones TEXT NULL,
  foto_url TEXT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_seguimiento_adopcion (adopcion_id),
  CONSTRAINT fk_seguimiento_adopcion FOREIGN KEY (adopcion_id) REFERENCES adopcion(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 19) passwordresettoken
-- =========================
CREATE TABLE IF NOT EXISTS passwordresettoken (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_passwordresettoken_usuario (usuario_id),
  KEY idx_passwordresettoken_token (token_hash),
  CONSTRAINT fk_passwordresettoken_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
