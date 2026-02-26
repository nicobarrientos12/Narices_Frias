-- Seed extra duenos y mascotas (continuando IDs desde 3)

-- =========================
-- Duenos (IDs 3+)
-- =========================
INSERT INTO dueno (id, nombre, direccion, telefono, correo, latitud, longitud)
VALUES
  (3, 'Carlos Rojas', 'Calle Sucre #120', '72214005', 'carlos.rojas@example.com', -17.384210, -66.158230),
  (4, 'Ana Flores', 'Av. Blanco Galindo km 3', '76451230', 'ana.flores@example.com', -17.386900, -66.163450),
  (5, 'Luis Andrade', 'Barrio Temporal', '70123456', 'luis.andrade@example.com', -17.392110, -66.149870),
  (6, 'Rocio Vargas', 'Zona Norte, Calle 7', '77990123', 'rocio.vargas@example.com', -17.375800, -66.171200),
  (7, 'Miguel Lima', 'Villa Primero de Mayo', '73556677', 'miguel.lima@example.com', -17.400120, -66.142560),
  (8, 'Sofia Paredes', 'Tiquipaya Centro', '71223344', 'sofia.paredes@example.com', -17.341200, -66.211300),
  (9, 'Diego Arce', 'Sacaba Av. Villazon', '72334455', 'diego.arce@example.com', -17.397600, -66.040900),
  (10, 'Paola Medina', 'Quillacollo, C. Bolivar', '73445566', 'paola.medina@example.com', -17.393900, -66.277100),
  (11, 'Hugo Salazar', 'C. Aroma #45', '74556677', 'hugo.salazar@example.com', -17.389500, -66.156800),
  (12, 'Mariana Cespedes', 'Av. America Este', '75667788', 'mariana.cespedes@example.com', -17.383700, -66.150400);

-- =========================
-- Mascotas (IDs 3+)
-- =========================
INSERT INTO mascota (id, nombre, especie, raza, edad, genero, esterilizado, color, caracteristicas, fecha_ingreso, estado_llegada, foto_url, dueno_id)
VALUES
  (3, 'Max', 'Perro', 'Labrador', 4, 'Macho', 'Si', 'Negro', 'Activo y amigable', '2025-09-15', 'Adoptado', NULL, 3),
  (4, 'Nina', 'Perro', 'Poodle', 2, 'Hembra', 'No', 'Blanco', 'Tranquila y carinosa', '2025-10-01', 'Adoptado', NULL, 4),
  (5, 'Thor', 'Perro', 'Pastor Aleman', 5, 'Macho', 'Si', 'Cafe', 'Guardian y obediente', '2025-07-20', 'En refugio', NULL, NULL),
  (6, 'Kiara', 'Gato', 'Criollo', 1, 'Hembra', 'No', 'Atigrado', 'Curiosa y juguetona', '2025-12-05', 'En refugio', NULL, NULL),
  (7, 'Rocky', 'Perro', 'Bulldog', 3, 'Macho', 'Si', 'Blanco y cafe', 'Sociable', '2025-08-28', 'Adoptado', NULL, 5),
  (8, 'Lola', 'Gato', 'Persa', 3, 'Hembra', 'Si', 'Gris', 'Serena', '2025-06-12', 'Adoptado', NULL, 6),
  (9, 'Toby', 'Perro', 'Beagle', 2, 'Macho', 'No', 'Tricolor', 'Olfato fuerte', '2025-11-18', 'En refugio', NULL, NULL),
  (10, 'Mia', 'Gato', 'Siames', 4, 'Hembra', 'Si', 'Crema', 'Vocal y sociable', '2025-05-09', 'Adoptado', NULL, 7),
  (11, 'Simba', 'Gato', 'Mestizo', 2, 'Macho', 'No', 'Naranja', 'Jugueton', '2025-10-22', 'En refugio', NULL, NULL),
  (12, 'Bruno', 'Perro', 'Mestizo', 6, 'Macho', 'Si', 'Negro', 'Muy tranquilo', '2025-04-02', 'Adoptado', NULL, 8),
  (13, 'Lia', 'Perro', 'Shih Tzu', 1, 'Hembra', 'No', 'Blanco y gris', 'Pequena y tierna', '2025-09-02', 'Adoptado', NULL, 9),
  (14, 'Cleo', 'Gato', 'Angora', 5, 'Hembra', 'Si', 'Blanco', 'Elegante', '2025-03-18', 'Adoptado', NULL, 10),
  (15, 'Rex', 'Perro', 'Boxer', 3, 'Macho', 'No', 'Cafe', 'Energetico', '2025-12-01', 'En refugio', NULL, NULL),
  (16, 'Nube', 'Gato', 'Criollo', 1, 'Hembra', 'No', 'Blanco', 'Timida', '2025-11-25', 'En refugio', NULL, NULL),
  (17, 'Sol', 'Perro', 'Golden Retriever', 4, 'Hembra', 'Si', 'Dorado', 'Docil', '2025-02-14', 'Adoptado', NULL, 11),
  (18, 'Dante', 'Perro', 'Pitbull', 2, 'Macho', 'No', 'Gris', 'Fuerte y leal', '2025-06-30', 'En refugio', NULL, NULL),
  (19, 'Lilo', 'Gato', 'Mestizo', 3, 'Hembra', 'Si', 'Negro', 'Carinosa', '2025-07-11', 'Adoptado', NULL, 12),
  (20, 'Paco', 'Perro', 'Chihuahua', 1, 'Macho', 'No', 'Cafe claro', 'Pequeno y alerta', '2025-10-30', 'Adoptado', NULL, 4);
