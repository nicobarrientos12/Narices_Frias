-- Seed extra citas y campanias (continuando IDs)

-- =========================
-- Citas (IDs 3+)
-- =========================
INSERT INTO cita (id, mascota_id, dueno_id, usuario_id, fecha, motivo, precio, tipo, observaciones)
VALUES
  (3, 3, 3, 2, '2025-09-16 09:00:00', 'Control post adopcion', 50.00, 'Control', 'Revision general'),
  (4, 4, 4, 2, '2025-10-05 11:15:00', 'Vacunacion canina', 80.00, 'Vacunación', 'Aplicar vacuna multiple'),
  (5, 5, NULL, 2, '2025-07-25 16:30:00', 'Consulta por sarna', 65.00, 'Consulta', 'Iniciar tratamiento'),
  (6, 6, NULL, 3, '2025-12-08 14:00:00', 'Control felino', 55.00, 'Control', 'Evaluar peso'),
  (7, 7, 5, 2, '2025-08-30 10:00:00', 'Cirugia programada', 500.00, 'Cirugía', 'Ayuno 12 horas'),
  (8, 8, 6, 2, '2025-06-18 09:45:00', 'Consulta general', 60.00, 'Consulta', 'Sin novedades'),
  (9, 9, NULL, 3, '2025-11-20 15:20:00', 'Vacunacion cachorro', 75.00, 'Vacunación', 'Primera dosis'),
  (10, 10, 7, 2, '2025-05-15 12:00:00', 'Control anual', 55.00, 'Control', 'Revision completa'),
  (11, 11, NULL, 3, '2025-10-24 17:00:00', 'Consulta felina', 65.00, 'Consulta', 'Ojos irritados'),
  (12, 12, 8, 2, '2025-04-05 10:30:00', 'Vacunacion refuerzo', 70.00, 'Vacunación', 'Refuerzo anual'),
  (13, 13, 9, 2, '2025-09-12 13:40:00', 'Consulta control', 55.00, 'Consulta', 'Seguimiento'),
  (14, 14, 10, 3, '2025-03-28 09:10:00', 'Vacunacion felina', 70.00, 'Vacunación', 'Refuerzo'),
  (15, 15, NULL, 3, '2025-12-03 16:00:00', 'Consulta general', 60.00, 'Consulta', 'Estado general'),
  (16, 16, NULL, 2, '2025-11-27 11:00:00', 'Consulta felina', 60.00, 'Consulta', 'Control de peso'),
  (17, 17, 11, 2, '2025-02-18 08:30:00', 'Control post adopcion', 50.00, 'Control', 'Sin novedades'),
  (18, 18, NULL, 3, '2025-07-02 15:50:00', 'Consulta por fiebre', 70.00, 'Consulta', 'Aplicar pruebas'),
  (19, 19, 12, 2, '2025-07-14 10:40:00', 'Vacunacion refuerzo', 70.00, 'Vacunación', 'Aplicar refuerzo'),
  (20, 20, 4, 2, '2025-10-31 09:20:00', 'Consulta general', 60.00, 'Consulta', 'Control general');

-- =========================
-- Campanias (IDs 2+)
-- =========================
INSERT INTO campania (id, usuario_id, nombre, fecha, monto_invertido, total_recaudado, ganancia)
VALUES
  (2, 2, 'Campana de Primavera', '2025-09-20', 650.00, 1500.00, 850.00),
  (3, 3, 'Campana de Verano', '2025-12-05', 700.00, 1750.00, 1050.00),
  (4, 2, 'Jornada de Esterilizacion', '2025-10-12', 900.00, 2100.00, 1200.00),
  (5, 3, 'Feria de Adopcion', '2025-08-25', 400.00, 1200.00, 800.00),
  (6, 2, 'Campana Solidaria', '2025-11-10', 550.00, 1400.00, 850.00),
  (7, 3, 'Campana Escolar', '2025-04-18', 300.00, 900.00, 600.00);
