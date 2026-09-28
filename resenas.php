<?php
require_once __DIR__ . '/config/bootstrap.php';

$uid = usuarioId();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
	$pid = (int) ($_GET['producto_id'] ?? 0);
	$st = $pdo->prepare("SELECT r.calificacion,r.comentario,r.fecha,u.nombre FROM resenas r JOIN usuarios u ON u.id=r.usuario_id WHERE r.producto_id=? ORDER BY r.fecha DESC");
	$st->execute([$pid]);
	respuesta(['ok' => true, 'resenas' => $st->fetchAll()]);
}

$d = leerJson();
$pid = (int) ($d['producto_id'] ?? 0);
$cal = (int) ($d['calificacion'] ?? 0);
$com = trim((string) ($d['comentario'] ?? ''));

if ($cal < 1 || $cal > 5) {
	respuesta(['ok' => false, 'mensaje' => 'Calificación entre 1 y 5.'], 422);
}

$st = $pdo->prepare("SELECT id FROM pedidos WHERE id=? AND usuario_id=? AND estado='entregado'");
$st->execute([(int) ($d['pedido_id'] ?? 0), $uid]);

if (!$st->fetch()) {
	respuesta(['ok' => false, 'mensaje' => 'Solo puedes reseñar después de una compra entregada.'], 422);
}

$pdo->prepare("INSERT INTO resenas(usuario_id,producto_id,pedido_id,calificacion,comentario) VALUES(?,?,?,?,?)")->execute([$uid, $pid, (int) $d['pedido_id'], $cal, $com]);
respuesta(['ok' => true]);
