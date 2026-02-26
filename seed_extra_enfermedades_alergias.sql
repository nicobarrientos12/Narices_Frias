-- Seed extra enfermedades y alergias (continuando IDs desde 3)

-- =========================
-- Enfermedades (IDs 3+)
-- =========================
INSERT INTO enfermedad (id, nombre, descripcion)
VALUES
  (3, 'Parvovirosis', 'Enfermedad viral gastrointestinal'),
  (4, 'Moquillo', 'Enfermedad viral respiratoria y neurologica'),
  (5, 'Leptospirosis', 'Infeccion bacteriana zoonotica'),
  (6, 'Gastroenteritis', 'Inflamacion del tracto digestivo'),
  (7, 'Sarna', 'Enfermedad parasitaria de la piel'),
  (8, 'Conjuntivitis', 'Inflamacion de la conjuntiva ocular'),
  (9, 'Insuficiencia renal', 'Disminucion de la funcion renal'),
  (10, 'Diabetes', 'Alteracion metabolica de la glucosa'),
  (11, 'Artritis', 'Inflamacion de articulaciones'),
  (12, 'Anemia', 'Disminucion de glóbulos rojos'),
  (13, 'Bronquitis', 'Inflamacion bronquial'),
  (14, 'Pancreatitis', 'Inflamacion del pancreas'),
  (15, 'Hepatitis', 'Inflamacion del higado'),
  (16, 'Gingivitis', 'Inflamacion de las encias'),
  (17, 'Obesidad', 'Exceso de peso corporal'),
  (18, 'Otitis cronica', 'Inflamacion persistente del oido');

-- =========================
-- Alergias (IDs 3+)
-- =========================
INSERT INTO alergia (id, nombre, descripcion)
VALUES
  (3, 'Acari', 'Alergia a acaros del polvo'),
  (4, 'Pulga', 'Reaccion a picadura de pulga'),
  (5, 'Lacteos', 'Intolerancia o reaccion a lacteos'),
  (6, 'Pescado', 'Reaccion a proteina de pescado'),
  (7, 'Carne de res', 'Reaccion a proteina de res'),
  (8, 'Maiz', 'Alergia a maiz o derivados'),
  (9, 'Trigo', 'Sensibilidad a gluten o trigo'),
  (10, 'Soja', 'Reaccion a soja'),
  (11, 'Huevo', 'Reaccion a proteina de huevo'),
  (12, 'Moho', 'Alergia a hongos ambientales'),
  (13, 'Pasto', 'Alergia a gramíneas'),
  (14, 'Perfumes', 'Sensibilidad a fragancias'),
  (15, 'Polvo', 'Alergia a polvo domestico'),
  (16, 'Picaduras', 'Reaccion a insectos varios');
