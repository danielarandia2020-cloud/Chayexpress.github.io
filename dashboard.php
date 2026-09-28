<?php
require_once __DIR__ . '/../config/bootstrap.php';
adminId();

$stats = [
	'clientes' => (int) $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn(),
	'productos' => (int) $pdo->query("SELECT COUNT(*) FROM productos WHERE activo=1")->fetchColumn(),
	'pedidos_pendientes' => (int) $pdo->query("SELECT COUNT(*) FROM pedidos WHERE estado IN ('recibido','confirmado','preparando')")->fetchColumn(),
	'ventas' => (float) $pdo->query("SELECT COALESCE(SUM(total),0) FROM pedidos WHERE estado NOT IN ('cancelado')")->fetchColumn()
];

respuesta(['ok' => true, 'stats' => $stats]);
