-- Seed extra adopciones y tratamientos (continuando IDs)

-- =========================
-- Adopciones (IDs 3+)
-- =========================
INSERT INTO adopcion (id, mascota_id, dueno_id, fecha_solicitud, fecha_aprobacion, estado_llegada, observaciones, usuario_id)
VALUES
  (3, 3, 3, '2025-09-20', '2025-09-28', 'Aprobada', 'Visita domiciliaria OK', 2),
  (4, 4, 4, '2025-10-10', '2025-10-18', 'Aprobada', 'Familia adoptante verificada', 2),
  (5, 7, 5, '2025-09-01', NULL, 'En revisión', 'Pendiente de entrevista', 3),
  (6, 8, 6, '2025-06-15', '2025-06-25', 'Aprobada', 'Adopcion responsable', 3),
  (7, 10, 7, '2025-05-12', '2025-05-20', 'Aprobada', 'Seguimiento a 30 dias', 2),
  (8, 12, 8, '2025-04-05', '2025-04-12', 'Aprobada', 'Adopcion completada', 2),
  (9, 13, 9, '2025-09-10', NULL, 'En revisión', 'Documentos en revision', 3),
  (10, 14, 10, '2025-03-25', '2025-04-02', 'Aprobada', 'Entrega realizada', 2),
  (11, 17, 11, '2025-02-18', '2025-02-26', 'Aprobada', 'Adoptante con experiencia', 2),
  (12, 19, 12, '2025-07-15', '2025-07-22', 'Aprobada', 'Adopcion sin novedades', 3);

-- =========================
-- Tratamientos (IDs 2+)
-- =========================
INSERT INTO tratamiento (id, mascota_id, diagnostico, fecha_inicio, fecha_fin, precio, observaciones, usuario_id)
VALUES
  (2, 2, 'Otitis leve', '2026-01-10', '2026-01-20', 85.00, 'Gotas cada 12 horas', 2),
  (3, 3, 'Gastroenteritis', '2025-09-16', '2025-09-23', 140.00, 'Dieta blanda y hidratacion', 2),
  (4, 5, 'Sarna', '2025-07-22', '2025-08-05', 180.00, 'Banios medicados', 3),
  (5, 6, 'Conjuntivitis', '2025-12-06', '2025-12-12', 60.00, 'Limpieza ocular', 2),
  (6, 9, 'Gingivitis', '2025-11-19', '2025-12-01', 90.00, 'Profilaxis dental', 3),
  (7, 11, 'Dermatitis', '2025-10-23', '2025-11-02', 110.00, 'Control semanal', 2),
  (8, 15, 'Artritis', '2025-12-02', NULL, 220.00, 'Tratamiento continuo', 2),
  (9, 16, 'Bronquitis', '2025-11-26', '2025-12-06', 130.00, 'Nebulizaciones', 3),
  (10, 18, 'Leptospirosis', '2025-07-01', '2025-07-15', 250.00, 'Antibioticos y fluidos', 2),
  (11, 20, 'Hepatitis', '2025-10-31', '2025-11-15', 200.00, 'Monitoreo hepatico', 3);
