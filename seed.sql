-- Seed data for NARICES_FRIAS
-- All user passwords are bcrypt hash of: 12345678

USE narices_frias;

-- =========================
-- Usuarios
-- =========================
INSERT INTO usuario (id, nombre, primer_apellido, segundo_apellido, carnet_identidad, direccion, latitud, longitud, correo, contrasena, rol)
VALUES
  (1, 'Ana', 'Paz', 'Rios', 'CI-1001', 'Av. Central 123', -17.389500, -66.156800, 'ana@naf.local', '$2b$10$AJWBClKyoi0yM9jitdTfge9Trtl0dILo8GR5CqWM1E/69z.gdoUh.', 'Administrador'),
  (2, 'Bruno', 'Lopez', 'Soto', 'CI-1002', 'Calle Norte 45', -17.392100, -66.160200, 'bruno@naf.local', '$2b$10$AJWBClKyoi0yM9jitdTfge9Trtl0dILo8GR5CqWM1E/69z.gdoUh.', 'Veterinario'),
  (3, 'Carla', 'Mendez', 'Torrez', 'CI-1003', 'Zona Sur 98', -17.401200, -66.170500, 'carla@naf.local', '$2b$10$AJWBClKyoi0yM9jitdTfge9Trtl0dILo8GR5CqWM1E/69z.gdoUh.', 'Voluntario');

-- =========================
-- Dueños
-- =========================
INSERT INTO dueno (id, nombre, direccion, telefono, correo, latitud, longitud)
VALUES
  (1, 'Juan Perez', 'Barrio Central', '+591 700-11111', 'juan@example.com', -17.385000, -66.160000),
  (2, 'Maria Quispe', 'Av. Independencia', '+591 700-22222', 'maria@example.com', -17.390000, -66.155000);

-- =========================
-- Mascotas
-- =========================
INSERT INTO mascota (id, nombre, especie, raza, edad, genero, esterilizado, color, caracteristicas, fecha_ingreso, estado_llegada, foto_url, dueno_id)
VALUES
  (1, 'Luna', 'Perro', 'Mestizo', 3, 'Hembra', 'Si', 'Marron', 'Docil y juguetona', '2025-08-10', 'Adoptado', NULL, 1),
  (2, 'Milo', 'Gato', 'Siames', 2, 'Macho', 'No', 'Gris', 'Curioso y activo', '2025-11-02', 'En refugio', NULL, NULL);

-- =========================
-- Vacunas
-- =========================
INSERT INTO vacuna (id, nombre, descripcion, precio)
VALUES
  (1, 'Rabia', 'Vacuna antirrabica', 50.00),
  (2, 'Triple Felina', 'Protege contra enfermedades felinas comunes', 70.00);

-- =========================
-- Medicamentos
-- =========================
INSERT INTO medicamento (id, nombre, descripcion, precio)
VALUES
  (1, 'Amoxicilina', 'Antibiotico de amplio espectro', 25.50),
  (2, 'Ivermectina', 'Antiparasitario', 18.00);

-- =========================
-- Enfermedades
-- =========================
INSERT INTO enfermedad (id, nombre, descripcion)
VALUES
  (1, 'Dermatitis', 'Inflamacion de la piel'),
  (2, 'Otitis', 'Infeccion del oido');

-- =========================
-- Alergias
-- =========================
INSERT INTO alergia (id, nombre, descripcion)
VALUES
  (1, 'Polen', 'Alergia estacional'),
  (2, 'Pollo', 'Reaccion a proteina de pollo');

-- =========================
-- Adopciones
-- =========================
INSERT INTO adopcion (id, mascota_id, dueno_id, fecha_solicitud, fecha_aprobacion, estado_llegada, observaciones, usuario_id)
VALUES
  (1, 1, 1, '2025-08-15', '2025-08-20', 'Aprobada', 'Adopcion completada', 3),
  (2, 2, 2, '2026-01-05', NULL, 'En revisión', 'En proceso de evaluacion', 3);

-- =========================
-- Tratamientos
-- =========================
INSERT INTO tratamiento (id, mascota_id, diagnostico, fecha_inicio, fecha_fin, precio, observaciones, usuario_id)
VALUES
  (1, 1, 'Dermatitis leve', '2025-08-12', '2025-08-22', 120.00, 'Control semanal', 2);

-- =========================
-- Citas
-- =========================
INSERT INTO cita (id, mascota_id, dueno_id, usuario_id, fecha, motivo, precio, tipo, observaciones)
VALUES
  (1, 1, 1, 2, '2025-08-12 10:30:00', 'Consulta general', 60.00, 'Consulta', 'Sin novedades'),
  (2, 2, NULL, 2, '2026-01-10 15:00:00', 'Vacunacion felina', 70.00, 'Vacunación', 'Aplicar refuerzo');

-- =========================
-- Campanias
-- =========================
INSERT INTO campania (id, usuario_id, nombre, fecha, monto_invertido, total_recaudado, ganancia)
VALUES
  (1, 3, 'Campaña de Invierno', '2025-06-15', 500.00, 1300.00, 800.00);

-- =========================
-- Donaciones
-- =========================
INSERT INTO donacion (id, usuario_id, nombre_donante, tipo, monto, descripcion_especie, fecha_donacion)
VALUES
  (1, 3, 'Anonimo', 'Monetaria', 200.00, NULL, '2025-06-20'),
  (2, 3, 'PetShop Amigo', 'Especie', NULL, '30 kg de alimento para perros', '2025-06-22');

-- =========================
-- Historial clinico
-- =========================
INSERT INTO historial_clinico (id, mascota_id, fecha, descripcion, usuario_id)
VALUES
  (1, 1, '2025-08-12 10:30:00', 'Revision general y signos leves de dermatitis', 2);

-- =========================
-- Mascota vacunas
-- =========================
INSERT INTO mascota_vacuna (id, mascota_id, vacuna_id, fecha_aplicacion, proxima_aplicacion, usuario_id)
VALUES
  (1, 1, 1, '2025-08-12', '2026-08-12', 2),
  (2, 2, 2, '2026-01-10', '2026-07-10', 2);

-- =========================
-- Tratamiento medicamentos
-- =========================
INSERT INTO tratamiento_medicamento (id, tratamiento_id, medicamento_id, dosis, frecuencia, duracion)
VALUES
  (1, 1, 1, '250 mg', 'Cada 12 horas', '10 dias');

-- =========================
-- Mascota enfermedad
-- =========================
INSERT INTO mascota_enfermedad (id, mascota_id, enfermedad_id, fecha_diagnostico, observaciones)
VALUES
  (1, 1, 1, '2025-08-12', 'Dermatitis leve');

-- =========================
-- Mascota alergia
-- =========================
INSERT INTO mascota_alergia (id, mascota_id, alergia_id, observaciones)
VALUES
  (1, 1, 1, 'Estornudos en primavera');

-- =========================
-- Seguimiento postadopcion
-- =========================
INSERT INTO seguimiento_postadopcion (id, adopcion_id, fecha, observaciones, foto_url)
VALUES
  (1, 1, '2025-09-01', 'Mascota adaptada y en buen estado', NULL);

-- =========================
-- Password reset tokens
-- =========================
INSERT INTO passwordresettoken (id, usuario_id, token_hash, expires_at, used, created_at)
VALUES
  (1, 1, 'd2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2', '2026-02-10 00:00:00', 0, '2026-02-02 12:00:00');
