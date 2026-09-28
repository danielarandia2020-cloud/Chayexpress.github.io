CREATE DATABASE IF NOT EXISTS chay_express
	CHARACTER SET utf8mb4
	COLLATE utf8mb4_unicode_ci;
USE chay_express;
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS
	resenas,
	detalle_pedido,
	pedidos,
	carrito_items,
	carritos,
	direcciones,
	productos,
	categorias,
	admins,
	usuarios;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE usuarios (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	nombre VARCHAR(80) NOT NULL,
	apellido VARCHAR(80) NOT NULL,
	email VARCHAR(150) NOT NULL UNIQUE,
	password_hash VARCHAR(255) NOT NULL,
	telefono VARCHAR(30) NULL,
	puntos_chay INT UNSIGNED NOT NULL DEFAULT 0,
	fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE admins (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	nombre VARCHAR(120) NOT NULL,
	email VARCHAR(150) NOT NULL UNIQUE,
	password_hash VARCHAR(255) NOT NULL,
	activo TINYINT(1) NOT NULL DEFAULT 1,
	fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categorias (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	slug VARCHAR(80) NOT NULL UNIQUE,
	nombre VARCHAR(100) NOT NULL,
	imagen VARCHAR(255) NULL,
	activa TINYINT(1) NOT NULL DEFAULT 1,
	fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE productos (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	categoria_id INT UNSIGNED NOT NULL,
	slug VARCHAR(160) NOT NULL UNIQUE,
	nombre VARCHAR(160) NOT NULL,
	descripcion TEXT NOT NULL,
	precio DECIMAL(12,2) NOT NULL,
	imagen VARCHAR(255) NULL,
	activo TINYINT(1) NOT NULL DEFAULT 1,
	fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id)
) ENGINE=InnoDB;

CREATE TABLE direcciones (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	usuario_id INT UNSIGNED NOT NULL,
	etiqueta VARCHAR(50) NOT NULL,
	direccion_texto VARCHAR(255) NOT NULL,
	barrio VARCHAR(100) NULL,
	localidad VARCHAR(100) NULL,
	ciudad VARCHAR(100) NOT NULL DEFAULT 'Bogotá',
	tipo_inmueble ENUM('casa', 'apartamento', 'edificio', 'conjunto', 'otro') NOT NULL DEFAULT 'casa',
	detalle_inmueble VARCHAR(120) NULL,
	torre VARCHAR(50) NULL,
	apartamento VARCHAR(50) NULL,
	indicaciones TEXT NULL,
	latitud DECIMAL(10,7) NULL,
	longitud DECIMAL(10,7) NULL,
	predeterminada TINYINT(1) NOT NULL DEFAULT 0,
	fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_direcciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE carritos (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	usuario_id INT UNSIGNED NOT NULL UNIQUE,
	creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_carritos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE carrito_items (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	carrito_id INT UNSIGNED NOT NULL,
	producto_id INT UNSIGNED NOT NULL,
	cantidad INT UNSIGNED NOT NULL DEFAULT 1,
	personalizacion JSON NULL,
	precio_unitario DECIMAL(12,2) NOT NULL,
	CONSTRAINT fk_ci_carrito FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE,
	CONSTRAINT fk_ci_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
	UNIQUE KEY uq_carrito_producto_personalizacion (carrito_id, producto_id, id)
) ENGINE=InnoDB;

CREATE TABLE pedidos (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	usuario_id INT UNSIGNED NOT NULL,
	direccion_id INT UNSIGNED NOT NULL,
	subtotal DECIMAL(12,2) NOT NULL,
	descuento_puntos DECIMAL(12,2) NOT NULL DEFAULT 0,
	puntos_usados INT UNSIGNED NOT NULL DEFAULT 0,
	costo_domicilio DECIMAL(12,2) NOT NULL DEFAULT 0,
	total DECIMAL(12,2) NOT NULL,
	distancia_km DECIMAL(8,2) NULL,
	metodo_pago ENUM('efectivo', 'transferencia') NOT NULL,
	tipo_transferencia ENUM('tarjeta', 'pse', 'nequi') NULL,
	estado ENUM('recibido', 'confirmado', 'preparando', 'en_camino', 'entregado', 'cancelado') NOT NULL DEFAULT 'recibido',
	comprobante_imagen VARCHAR(255) NULL,
	pago_aprobado TINYINT(1) NOT NULL DEFAULT 0,
	numero_guia VARCHAR(120) NULL,
	fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	fecha_confirmacion DATETIME NULL,
	fecha_preparando DATETIME NULL,
	fecha_despacho DATETIME NULL,
	fecha_entrega DATETIME NULL,
	CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
	CONSTRAINT fk_pedidos_direccion FOREIGN KEY (direccion_id) REFERENCES direcciones(id)
) ENGINE=InnoDB;

CREATE TABLE detalle_pedido (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	pedido_id INT UNSIGNED NOT NULL,
	producto_id INT UNSIGNED NULL,
	nombre_producto VARCHAR(160) NOT NULL,
	cantidad INT UNSIGNED NOT NULL,
	precio_unitario DECIMAL(12,2) NOT NULL,
	personalizacion JSON NULL,
	CONSTRAINT fk_dp_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
	CONSTRAINT fk_dp_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE resenas (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	usuario_id INT UNSIGNED NOT NULL,
	producto_id INT UNSIGNED NOT NULL,
	pedido_id INT UNSIGNED NULL,
	calificacion TINYINT UNSIGNED NOT NULL,
	comentario TEXT NULL,
	fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_res_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
	CONSTRAINT fk_res_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
	CONSTRAINT fk_res_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
	CONSTRAINT chk_calificacion CHECK (calificacion BETWEEN 1 AND 5)
) ENGINE=InnoDB;

INSERT INTO categorias (slug, nombre, imagen)
VALUES ('hamburguesas', 'Hamburguesas', '../img/categorias/hamburguesas.jpg');
INSERT INTO categorias (slug, nombre, imagen)
VALUES ('perros', 'Perros Calientes', '../img/categorias/perros.jpg');
INSERT INTO categorias (slug, nombre, imagen)
VALUES ('salchipapas', 'Salchipapas', '../img/categorias/salchipapas.jpg');
INSERT INTO categorias (slug, nombre, imagen)
VALUES ('pizzas', 'Pizzas', '../img/categorias/pizzas.jpg');
INSERT INTO categorias (slug, nombre, imagen)
VALUES ('bebidas', 'Bebidas', '../img/categorias/bebidas.jpg');
INSERT INTO categorias (slug, nombre, imagen)
VALUES ('postres', 'Postres', '../img/categorias/postres.jpg');
INSERT INTO categorias (slug, nombre, imagen)
VALUES ('combos', 'Combos', '../img/categorias/combos.jpg');

INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'hamburguesa-clasica-con-queso', 'Hamburguesa Clásica con Queso', 'Carne, queso, lechuga, tomate y salsa especial', 18000, '../img/productos/hamburguesas-1.jpg'
FROM categorias
WHERE slug = 'hamburguesas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'hamburguesa-doble-carne', 'Hamburguesa Doble Carne', 'Doble carne, doble queso, mucho sabor', 24000, '../img/productos/hamburguesas-2.jpg'
FROM categorias
WHERE slug = 'hamburguesas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'hamburguesa-bbq-tocineta', 'Hamburguesa BBQ Tocineta', 'Carne, tocineta, cebolla crispy y salsa BBQ', 22000, '../img/productos/hamburguesas-3.jpg'
FROM categorias
WHERE slug = 'hamburguesas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'hamburguesa-gourmet-chay', 'Hamburguesa Gourmet CHAY', 'Carne premium, queso cheddar y cebolla caramelizada', 26000, '../img/productos/hamburguesas-4.jpg'
FROM categorias
WHERE slug = 'hamburguesas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'hamburguesa-vegetariana', 'Hamburguesa Vegetariana', 'Base vegetal, queso, lechuga, tomate y salsa especial', 20000, '../img/productos/hamburguesas-5.jpg'
FROM categorias
WHERE slug = 'hamburguesas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'pizza-personal-de-pepperoni', 'Pizza Personal de Pepperoni', 'Salsa de tomate, mozzarella y pepperoni', 22000, '../img/productos/pizzas-1.jpg'
FROM categorias
WHERE slug = 'pizzas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'pizza-personal-hawaiana', 'Pizza Personal Hawaiana', 'Jamón, piña y mozzarella', 22000, '../img/productos/pizzas-2.jpg'
FROM categorias
WHERE slug = 'pizzas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'pizza-personal-de-pollo', 'Pizza Personal de Pollo', 'Pollo desmechado, maíz y mozzarella', 23000, '../img/productos/pizzas-3.jpg'
FROM categorias
WHERE slug = 'pizzas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'pizza-personal-vegetariana', 'Pizza Personal Vegetariana', 'Vegetales frescos y mozzarella', 21000, '../img/productos/pizzas-4.jpg'
FROM categorias
WHERE slug = 'pizzas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'pizza-personal-cuatro-quesos', 'Pizza Personal Cuatro Quesos', 'Mezcla de quesos derretidos', 24000, '../img/productos/pizzas-5.jpg'
FROM categorias
WHERE slug = 'pizzas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'perro-caliente-especial', 'Perro Caliente Especial', 'Salchicha, queso derretido, papas y salsas', 15000, '../img/productos/perros-1.jpg'
FROM categorias
WHERE slug = 'perros';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'perro-caliente-clasico', 'Perro Caliente Clásico', 'Salchicha, papas de paquete y salsas de la casa', 12000, '../img/productos/perros-2.jpg'
FROM categorias
WHERE slug = 'perros';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'perro-caliente-ranchero', 'Perro Caliente Ranchero', 'Salchicha, tocineta, queso y cebolla crispy', 17000, '../img/productos/perros-3.jpg'
FROM categorias
WHERE slug = 'perros';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'perro-caliente-doble-salchicha', 'Perro Caliente Doble Salchicha', 'Dos salchichas, queso y salsas', 18000, '../img/productos/perros-4.jpg'
FROM categorias
WHERE slug = 'perros';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'perro-caliente-mexicano', 'Perro Caliente Mexicano', 'Salchicha, guacamole y jalapeños', 17000, '../img/productos/perros-5.jpg'
FROM categorias
WHERE slug = 'perros';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'salchipapa-tradicional', 'Salchipapa Tradicional', 'Papas crocantes con salchicha y salsas', 12000, '../img/productos/salchipapas-1.jpg'
FROM categorias
WHERE slug = 'salchipapas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'papas-fritas-locas', 'Papas Fritas Locas', 'Con tocineta, queso fundido y salsas especiales', 14000, '../img/productos/salchipapas-2.jpg'
FROM categorias
WHERE slug = 'salchipapas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'salchipapa-ranchera', 'Salchipapa Ranchera', 'Papas, salchicha, tocineta y queso', 16000, '../img/productos/salchipapas-3.jpg'
FROM categorias
WHERE slug = 'salchipapas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'salchipapa-mixta', 'Salchipapa Mixta', 'Papas con salchicha y trozos de pollo', 17000, '../img/productos/salchipapas-4.jpg'
FROM categorias
WHERE slug = 'salchipapas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'papas-fritas-simples', 'Papas Fritas Simples', 'Crujientes, con sal fina', 9000, '../img/productos/salchipapas-5.jpg'
FROM categorias
WHERE slug = 'salchipapas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'postre-tres-leches', 'Postre Tres Leches', 'Clásico postre húmedo bañado en tres leches', 9000, '../img/productos/postres-1.jpg'
FROM categorias
WHERE slug = 'postres';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'brownie-con-helado', 'Brownie con Helado', 'Brownie tibio con bola de helado de vainilla', 11000, '../img/productos/postres-2.jpg'
FROM categorias
WHERE slug = 'postres';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'torta-de-chocolate', 'Torta de Chocolate', 'Porción de torta húmeda de chocolate', 9500, '../img/productos/postres-3.jpg'
FROM categorias
WHERE slug = 'postres';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'copa-de-helado', 'Copa de Helado', 'Tres bolas de helado con salsa a elección', 10000, '../img/productos/postres-4.jpg'
FROM categorias
WHERE slug = 'postres';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'waffle-con-frutas', 'Waffle con Frutas', 'Waffle crocante con frutas frescas y miel', 12000, '../img/productos/postres-5.jpg'
FROM categorias
WHERE slug = 'postres';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'jugo-natural-de-lulo', 'Jugo Natural de Lulo', 'Recién exprimido', 8000, '../img/productos/bebidas-1.jpg'
FROM categorias
WHERE slug = 'bebidas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'jugo-natural-de-maracuya', 'Jugo Natural de Maracuyá', 'Recién exprimido', 8000, '../img/productos/bebidas-2.jpg'
FROM categorias
WHERE slug = 'bebidas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'jugo-natural-de-mora', 'Jugo Natural de Mora', 'Recién exprimido', 8000, '../img/productos/bebidas-3.jpg'
FROM categorias
WHERE slug = 'bebidas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'gaseosa-personal', 'Gaseosa Personal', '350 ml, varios sabores', 5000, '../img/productos/bebidas-4.jpg'
FROM categorias
WHERE slug = 'bebidas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'limonada-de-coco', 'Limonada de Coco', 'Limonada natural con coco', 9000, '../img/productos/bebidas-5.jpg'
FROM categorias
WHERE slug = 'bebidas';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'combo-el-personal', 'Combo El Personal', 'Hamburguesa clásica, papas y bebida', 24000, '../img/productos/combos-1.jpg'
FROM categorias
WHERE slug = 'combos';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'combo-el-parrandero', 'Combo El Parrandero', '2 hamburguesas, 2 bebidas y papas grandes', 42000, '../img/productos/combos-2.jpg'
FROM categorias
WHERE slug = 'combos';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'combo-la-cita', 'Combo La Cita', '2 hamburguesas gourmet, papas y 2 bebidas', 45000, '../img/productos/combos-3.jpg'
FROM categorias
WHERE slug = 'combos';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'combo-de-salchichas-familiar', 'Combo de Salchichas Familiar', 'Salchipapa familiar con 4 bebidas', 38000, '../img/productos/combos-4.jpg'
FROM categorias
WHERE slug = 'combos';
INSERT INTO productos (categoria_id, slug, nombre, descripcion, precio, imagen)
SELECT id, 'combo-duo-hamburguesas', 'Combo Dúo Hamburguesas', '2 hamburguesas clásicas con papas', 32000, '../img/productos/combos-5.jpg'
FROM categorias
WHERE slug = 'combos';
-- Crear el primer administrador con: http://localhost/chay-express/php/auth/crear_admin.php