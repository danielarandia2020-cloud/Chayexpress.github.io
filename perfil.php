<?php
require_once __DIR__ . '/config/bootstrap.php';

$uid = usuarioId();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
	$st = $pdo->prepare("SELECT id,nombre,apellido,email,telefono,puntos_chay,fecha_registro FROM usuarios WHERE id=?");
	$st->execute([$uid]);
	respuesta(['ok' => true, 'usuario' => $st->fetch()]);
}

if ($method === 'PUT') {
	$d = leerJson();
	$cam = [];
	$par = [];

	foreach (['nombre', 'apellido', 'telefono'] as $f) {
		if (array_key_exists($f, $d)) {
			$cam[] = "$f=?";
			$par[] = trim((string) $d[$f]);
		}
	}

	if (!$cam) {
		respuesta(['ok' => false, 'mensaje' => 'Sin cambios.'], 422);
	}

	$par[] = $uid;
	$pdo->prepare("UPDATE usuarios SET " . implode(',', $cam) . " WHERE id=?")->execute($par);
	respuesta(['ok' => true]);
}
