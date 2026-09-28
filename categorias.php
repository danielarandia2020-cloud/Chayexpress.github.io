<?php
require_once __DIR__ . '/../config/bootstrap.php';
adminId();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
	$st = $pdo->query("SELECT * FROM categorias ORDER BY nombre");
	respuesta(['ok' => true, 'categorias' => $st->fetchAll()]);
}

$d = leerJson();

if ($method === 'POST') {
	$nombre = trim((string) ($d['nombre'] ?? ''));
	$imagen = trim((string) ($d['imagen'] ?? ''));
	if ($nombre === '') {
		respuesta(['ok' => false, 'mensaje' => 'Nombre requerido.'], 422);
	}

	$slug = slugify($nombre);
	$st = $pdo->prepare("INSERT INTO categorias(slug,nombre,imagen) VALUES(?,?,?)");
	$st->execute([$slug, $nombre, $imagen ?: null]);
	respuesta(['ok' => true, 'id' => (int) $pdo->lastInsertId()]);
}

if ($method === 'PUT') {
	$id = (int) ($d['id'] ?? 0);
	$cam = [];
	$par = [];
	foreach (['nombre', 'imagen', 'activa'] as $f) {
		if (array_key_exists($f, $d)) {
			$cam[] = "$f=?";
			$par[] = $f === 'activa' ? (!empty($d[$f]) ? 1 : 0) : $d[$f];
		}
	}

	if (isset($d['nombre'])) {
		$cam[] = 'slug=?';
		$par[] = slugify((string) $d['nombre']);
	}

	$par[] = $id;
	$pdo->prepare("UPDATE categorias SET " . implode(',', $cam) . " WHERE id=?")->execute($par);
	respuesta(['ok' => true]);
}

if ($method === 'DELETE') {
	$id = (int) ($_GET['id'] ?? 0);
	$pdo->prepare("UPDATE categorias SET activa=0 WHERE id=?")->execute([$id]);
	respuesta(['ok' => true]);
}

respuesta(['ok' => false, 'mensaje' => 'Método no permitido.'], 405);
