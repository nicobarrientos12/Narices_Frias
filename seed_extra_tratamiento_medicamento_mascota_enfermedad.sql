-- Seed extra tratamiento_medicamento y mascota_enfermedad (continuando IDs)

-- =========================
-- Tratamiento medicamentos (IDs 2+)
-- =========================
INSERT INTO tratamiento_medicamento (id, tratamiento_id, medicamento_id, dosis, frecuencia, duracion)
VALUES
  (2, 2, 2, '200 mg', 'Cada 24 horas', '7 dias'),
  (3, 3, 3, '75 mg', 'Cada 12 horas', '5 dias'),
  (4, 4, 4, '10 mg', 'Cada 24 horas', '14 dias'),
  (5, 5, 5, '150 mg', 'Cada 8 horas', '7 dias'),
  (6, 6, 6, '500 mg', 'Cada 12 horas', '10 dias'),
  (7, 7, 7, '100 mg', 'Cada 24 horas', '15 dias'),
  (8, 8, 12, '7.5 mg', 'Cada 24 horas', '30 dias'),
  (9, 9, 10, '20 mg', 'Cada 24 horas', '10 dias'),
  (10, 10, 8, '50 mg', 'Cada 24 horas', '14 dias'),
  (11, 11, 25, '100 mg', 'Cada 12 horas', '21 dias');

-- =========================
-- Mascota enfermedad (IDs 2+)
-- =========================
INSERT INTO mascota_enfermedad (id, mascota_id, enfermedad_id, fecha_diagnostico, observaciones)
VALUES
  (2, 2, 2, '2026-01-12', 'Otitis leve'),
  (3, 3, 3, '2025-09-16', 'Cuadro agudo'),
  (4, 5, 7, '2025-07-22', 'Sarna moderada'),
  (5, 6, 8, '2025-12-06', 'Conjuntivitis'),
  (6, 9, 16, '2025-11-19', 'Gingivitis leve'),
  (7, 11, 1, '2025-10-23', 'Dermatitis recurrente'),
  (8, 15, 11, '2025-12-02', 'Dolor articular'),
  (9, 16, 13, '2025-11-26', 'Bronquitis estacional'),
  (10, 18, 5, '2025-07-01', 'Leptospirosis confirmada'),
  (11, 20, 15, '2025-10-31', 'Hepatitis leve');
