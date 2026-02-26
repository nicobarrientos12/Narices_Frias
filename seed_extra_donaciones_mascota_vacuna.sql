-- Seed extra donaciones y mascota_vacuna (continuando IDs)

-- =========================
-- Donaciones (IDs 3+)
-- =========================
INSERT INTO donacion (id, usuario_id, nombre_donante, tipo, monto, descripcion_especie, fecha_donacion)
VALUES
  (3, 2, 'Fundacion Huellitas', 'Monetaria', 350.00, NULL, '2025-07-05'),
  (4, 3, 'Anonimo', 'Monetaria', 120.00, NULL, '2025-08-10'),
  (5, 2, 'VetCare', 'Especie', NULL, '5 cajas de medicamentos', '2025-09-02'),
  (6, 3, 'SuperMascota', 'Especie', NULL, '20 kg de arena sanitaria', '2025-09-18'),
  (7, 2, 'Amigos de NAF', 'Monetaria', 500.00, NULL, '2025-10-08'),
  (8, 3, 'Colegio San Luis', 'Monetaria', 260.00, NULL, '2025-11-12'),
  (9, 2, 'Anonimo', 'Especie', NULL, '12 mantas termicas', '2025-11-25'),
  (10, 3, 'PetShop Central', 'Especie', NULL, '15 kg de alimento premium', '2025-12-03');

-- =========================
-- Mascota Vacuna (IDs 3+)
-- =========================
INSERT INTO mascota_vacuna (id, mascota_id, vacuna_id, fecha_aplicacion, proxima_aplicacion, usuario_id)
VALUES
  (3, 3, 3, '2025-09-16', '2026-09-16', 2),
  (4, 4, 4, '2025-10-05', '2026-04-05', 2),
  (5, 5, 6, '2025-07-25', '2026-01-25', 3),
  (6, 6, 17, '2025-12-08', '2026-06-08', 2),
  (7, 7, 14, '2025-08-30', '2026-08-30', 2),
  (8, 8, 21, '2025-06-18', '2026-06-18', 3),
  (9, 9, 11, '2025-11-20', '2026-05-20', 2),
  (10, 10, 19, '2025-05-15', '2026-05-15', 2),
  (11, 11, 18, '2025-10-24', '2026-04-24', 3),
  (12, 12, 13, '2025-04-05', '2026-04-05', 2),
  (13, 13, 15, '2025-09-12', '2026-03-12', 2),
  (14, 14, 20, '2025-03-28', '2026-03-28', 3),
  (15, 15, 7, '2025-12-03', '2026-06-03', 2),
  (16, 16, 22, '2025-11-27', '2026-05-27', 2),
  (17, 17, 24, '2025-02-18', '2026-02-18', 3),
  (18, 18, 5, '2025-07-02', '2026-01-02', 2),
  (19, 19, 30, '2025-07-14', '2026-07-14', 2),
  (20, 20, 27, '2025-10-31', '2026-10-31', 3);
