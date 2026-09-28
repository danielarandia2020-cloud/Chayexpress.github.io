<?php
require_once __DIR__ . '/config/bootstrap.php';

$uid = usuarioId();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
	$st = $pdo->prepare("SELECT * FROM direcciones WHERE usuario_id=? ORDER BY predeterminada DESC,id DESC");
	$st->execute([$uid]);
	respuesta(['ok' => true, 'direcciones' => $st->fetchAll()]);
}

$d = leerJson();

if ($method === 'POST') {
	$et = trim((string) ($d['etiqueta'] ?? 'Casa'));
	$dir = trim((string) ($d['direccion_texto'] ?? ''));
	$b = trim((string) ($d['barrio'] ?? ''));
	$loc = trim((string) ($d['localidad'] ?? ''));
	$c = trim((string) ($d['ciudad'] ?? 'Bogotá'));
	$tipo = trim((string) ($d['tipo_inmueble'] ?? 'casa'));
	$detalle = trim((string) ($d['detalle_inmueble'] ?? ''));
	$torre = trim((string) ($d['torre'] ?? ''));
	$apto = trim((string) ($d['apartamento'] ?? ''));
	$indicaciones = trim((string) ($d['indicaciones'] ?? ''));
	$lat = $d['latitud'] ?? null;
	$lng = $d['longitud'] ?? null;
	$pred = !empty($d['predeterminada']) ? 1 : 0;

	if ($dir === '') {
		respuesta(['ok' => false, 'mensaje' => 'La dirección es obligatoria.'], 422);
	}

	$pdo->beginTransaction();
	if ($pred) {
		$pdo->prepare("UPDATE direcciones SET predeterminada=0 WHERE usuario_id=?")->execute([$uid]);
	}

	$st = $pdo->prepare("INSERT INTO direcciones(usuario_id,etiqueta,direccion_texto,barrio,localidad,ciudad,tipo_inmueble,detalle_inmueble,torre,apartamento,indicaciones,latitud,longitud,predeterminada) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
	$st->execute([$uid, $et, $dir, $b, $loc, $c, $tipo, $detalle, $torre, $apto, $indicaciones, $lat, $lng, $pred]);
	$id = (int) $pdo->lastInsertId();
	$pdo->commit();

	respuesta(['ok' => true, 'id' => $id]);
}

if ($method === 'PUT') {
	$id = (int) ($d['id'] ?? 0);
	$st = $pdo->prepare("SELECT id FROM direcciones WHERE id=? AND usuario_id=?");
	$st->execute([$id, $uid]);

	if (!$st->fetch()) {
		respuesta(['ok' => false, 'mensaje' => 'Dirección no encontrada.'], 404);
	}

	if (!empty($d['predeterminada'])) {
		$pdo->prepare("UPDATE direcciones SET predeterminada=0 WHERE usuario_id=?")->execute([$uid]);
	}

	$cam = [];
	$par = [];
	foreach (['etiqueta', 'direccion_texto', 'barrio', 'localidad', 'ciudad', 'tipo_inmueble', 'detalle_inmueble', 'torre', 'apartamento', 'indicaciones', 'latitud', 'longitud', 'predeterminada'] as $f) {
		if (array_key_exists($f, $d)) {
			$cam[] = "$f=?";
			$par[] = $f === 'predeterminada' ? (!empty($d[$f]) ? 1 : 0) : $d[$f];
		}
	}

	$par[] = $id;
	$pdo->prepare("UPDATE direcciones SET " . implode(',', $cam) . " WHERE id=?")->execute($par);
	respuesta(['ok' => true]);
}

if ($method === 'DELETE') {
	$id = (int) ($_GET['id'] ?? 0);
	$pdo->prepare("DELETE FROM direcciones WHERE id=? AND usuario_id=?")->execute([$id, $uid]);
	respuesta(['ok' => true]);
}
