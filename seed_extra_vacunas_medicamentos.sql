-- Seed extra vacunas y medicamentos (continuando IDs desde 3)

-- =========================
-- Vacunas (IDs 3+)
-- =========================
INSERT INTO vacuna (id, nombre, descripcion, precio)
VALUES
  (3, 'Parvovirus', 'Previene parvovirus canino', 60.00),
  (4, 'Moquillo', 'Previene moquillo canino', 55.00),
  (5, 'Hepatitis Canina', 'Proteccion contra hepatitis infecciosa', 58.00),
  (6, 'Leptospirosis', 'Proteccion contra leptospirosis', 62.00),
  (7, 'Bordetella', 'Previene tos de las perreras', 45.00),
  (8, 'Parainfluenza', 'Proteccion contra parainfluenza', 48.00),
  (9, 'Coronavirus Canino', 'Proteccion contra coronavirus canino', 50.00),
  (10, 'Giardia', 'Proteccion contra giardiasis', 52.00),
  (11, 'Distemper', 'Previene distemper canino', 56.00),
  (12, 'Adenovirus', 'Proteccion contra adenovirus', 54.00),
  (13, 'Rabia 3 Anos', 'Refuerzo antirrabico trienal', 80.00),
  (14, 'Triple Canina', 'Parvo, moquillo y hepatitis', 75.00),
  (15, 'Quintuple Canina', 'Parvo, moquillo, hepatitis, parainfluenza, leptospirosis', 95.00),
  (16, 'Sextuple Canina', 'Quintuple + coronavirus', 105.00),
  (17, 'Leucemia Felina', 'Proteccion contra FeLV', 85.00),
  (18, 'Panleucopenia Felina', 'Proteccion contra panleucopenia', 70.00),
  (19, 'Calicivirus Felino', 'Proteccion contra calicivirus', 68.00),
  (20, 'Rinotraqueitis Felina', 'Proteccion contra rinotraqueitis', 68.00),
  (21, 'Triple Felina Plus', 'Triple felina con refuerzo', 82.00),
  (22, 'FIV', 'Proteccion contra inmunodeficiencia felina', 90.00),
  (23, 'Bordetella Intranasal', 'Proteccion respiratoria intranasal', 65.00),
  (24, 'Lyme', 'Proteccion contra enfermedad de Lyme', 88.00),
  (25, 'Leishmaniasis', 'Proteccion contra leishmaniasis', 120.00),
  (26, 'Tetano', 'Proteccion antitetanica', 40.00),
  (27, 'Influenza Canina', 'Proteccion contra influenza canina', 78.00),
  (28, 'Herpesvirus Canino', 'Proteccion contra herpesvirus', 72.00),
  (29, 'Clamidia Felina', 'Proteccion contra clamidia felina', 66.00),
  (30, 'Parvovirus Felino', 'Proteccion contra parvovirus felino', 64.00),
  (31, 'Giardia Canina', 'Proteccion contra giardia canina', 58.00),
  (32, 'Leptospira 4', 'Proteccion leptospira tetravalente', 110.00);

-- =========================
-- Medicamentos (IDs 3+)
-- =========================
INSERT INTO medicamento (id, nombre, descripcion, precio)
VALUES
  (3, 'Carprofeno', 'Antiinflamatorio no esteroideo', 32.50),
  (4, 'Prednisona', 'Corticoide antiinflamatorio', 15.00),
  (5, 'Metronidazol', 'Antibiotico y antiparasitario', 22.00),
  (6, 'Cefalexina', 'Antibiotico cefalosporina', 28.00),
  (7, 'Doxiciclina', 'Antibiotico tetraciclina', 26.00),
  (8, 'Enrofloxacina', 'Antibiotico fluoroquinolona', 40.00),
  (9, 'Clindamicina', 'Antibiotico lincosamida', 35.00),
  (10, 'Omeprazol', 'Protector gastrico', 18.00),
  (11, 'Famotidina', 'Antiacido', 16.00),
  (12, 'Meloxicam', 'Antiinflamatorio', 30.00),
  (13, 'Tramadol', 'Analgesico', 24.00),
  (14, 'Furosemida', 'Diuretico', 20.00),
  (15, 'Amlodipino', 'Antihipertensivo', 25.00),
  (16, 'Apoquel', 'Control de prurito alergico', 65.00),
  (17, 'Ciclosporina', 'Inmunosupresor', 70.00),
  (18, 'Gabapentina', 'Analgesico y anticonvulsivo', 27.00),
  (19, 'Fenobarbital', 'Anticonvulsivo', 29.00),
  (20, 'Levetiracetam', 'Anticonvulsivo', 55.00),
  (21, 'Maropitant', 'Antiemetico', 38.00),
  (22, 'Sucralfato', 'Protector mucosa gastrica', 21.00),
  (23, 'Amoxicilina/Ac. Clavulanico', 'Antibiotico combinado', 45.00),
  (24, 'Ciprofloxacina', 'Antibiotico fluoroquinolona', 36.00),
  (25, 'Ketoconazol', 'Antifungico', 33.00),
  (26, 'Itraconazol', 'Antifungico de amplio espectro', 60.00),
  (27, 'Miconazol', 'Antifungico topico', 19.00),
  (28, 'Selamectina', 'Antiparasitario topico', 58.00),
  (29, 'Milbemicina', 'Antiparasitario interno', 42.00),
  (30, 'Prazicuantel', 'Antiparasitario cestodos', 25.00),
  (31, 'Albendazol', 'Antiparasitario', 17.00),
  (32, 'Vitamina B12', 'Suplemento vitaminico', 12.00),
  (33, 'Suero Fisiologico', 'Solucion para hidratacion', 10.00),
  (34, 'Dexametasona', 'Corticoide', 20.00);
