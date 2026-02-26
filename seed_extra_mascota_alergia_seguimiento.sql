-- Seed extra mascota_alergia y seguimiento_postadopcion (continuando IDs)

-- =========================
-- Mascota alergia (IDs 2+)
-- =========================
INSERT INTO mascota_alergia (id, mascota_id, alergia_id, observaciones)
VALUES
  (2, 2, 2, 'Reaccion a alimento con pollo'),
  (3, 3, 3, 'Picazon por acaros'),
  (4, 4, 5, 'Irritacion leve'),
  (5, 5, 4, 'Rascado frecuente'),
  (6, 6, 9, 'Sensibilidad a trigo'),
  (7, 7, 7, 'Reaccion a carne de res'),
  (8, 8, 10, 'Molestias digestivas'),
  (9, 9, 12, 'Congestion por moho'),
  (10, 10, 13, 'Estornudos en pasto'),
  (11, 11, 15, 'Alergia a polvo'),
  (12, 12, 8, 'Reaccion a maiz'),
  (13, 13, 14, 'Irritacion por perfumes'),
  (14, 14, 6, 'Reaccion a pescado'),
  (15, 15, 11, 'Reaccion a huevo'),
  (16, 16, 16, 'Reaccion a picaduras'),
  (17, 17, 5, 'Alergia alimentaria'),
  (18, 18, 3, 'Acaros'),
  (19, 19, 4, 'Picaduras de pulga'),
  (20, 20, 2, 'Sensibilidad a pollo');

-- =========================
-- Seguimiento postadopcion (IDs 2+)
-- =========================
INSERT INTO seguimiento_postadopcion (id, adopcion_id, fecha, observaciones, foto_url)
VALUES
  (2, 3, '2025-10-05', 'Mascota estable y activa', NULL),
  (3, 4, '2025-10-30', 'Adaptacion exitosa', NULL),
  (4, 6, '2025-07-10', 'Buen estado general', NULL),
  (5, 7, '2025-06-05', 'Control de peso OK', NULL),
  (6, 8, '2025-05-01', 'Sin observaciones', NULL),
  (7, 10, '2025-04-20', 'Buen comportamiento', NULL),
  (8, 11, '2025-03-10', 'Energia normal', NULL),
  (9, 12, '2025-08-01', 'Sin novedades', NULL);
