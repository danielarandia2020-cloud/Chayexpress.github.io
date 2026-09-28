<?php
require_once __DIR__ . '/../config/db.php';
$st = $pdo->query("SELECT id,usuario_id,total FROM pedidos WHERE estado='en_camino' AND fecha_despacho IS NOT NULL AND fecha_despacho <= DATE_SUB(NOW(), INTERVAL 48 HOUR)");
$rows = $st->fetchAll();

foreach ($rows as $p) {
	$pdo->beginTransaction();
	$pdo->prepare("UPDATE pedidos SET estado='entregado',fecha_entrega=NOW() WHERE id=? AND estado='en_camino'")->execute([$p['id']]);
	$pdo->prepare("UPDATE usuarios SET puntos_chay=puntos_chay+? WHERE id=?")->execute([floor($p['total'] / 1000), $p['usuario_id']]);
	$pdo->commit();
}
echo "Pedidos entregados automáticamente: " . count($rows) . "\n";
