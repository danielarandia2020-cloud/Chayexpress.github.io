<?php
require_once __DIR__ . '/../config/bootstrap.php';
adminId();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
	$st = $pdo->query("SELECT p.*,u.nombre,u.apellido,u.email,u.telefono,d.direccion_texto,d.barrio,d.ciudad,d.latitud,d.longitud FROM pedidos p JOIN usuarios u ON u.id=p.usuario_id JOIN direcciones d ON d.id=p.direccion_id ORDER BY p.id DESC");
	$ped = $st->fetchAll();
	foreach ($ped as &$p) {
		$q = $pdo->prepare("SELECT * FROM detalle_pedido WHERE pedido_id=?");
		$q->execute([$p['id']]);
		$p['items'] = $q->fetchAll();
	}

	respuesta(['ok' => true, 'pedidos' => $ped]);
}
$d = leerJson();
$id = (int) ($d['id'] ?? 0);
$accion = (string) ($d['accion'] ?? '');

$st = $pdo->prepare("SELECT * FROM pedidos WHERE id=?");
$st->execute([$id]);
$p = $st->fetch();
if (!$p) {
	respuesta(['ok' => false, 'mensaje' => 'Pedido no encontrado.'], 404);
}

if ($accion === 'aprobar_pago') {
	if ($p['metodo_pago'] !== 'transferencia') {
		respuesta(['ok' => false, 'mensaje' => 'Este pedido no requiere aprobación de transferencia.'], 422);
	}
	$pdo->prepare("UPDATE pedidos SET pago_aprobado=1,estado='confirmado',fecha_confirmacion=NOW() WHERE id=?")->execute([$id]);
}
elseif ($accion === 'preparar') {
	if ($p['estado'] !== 'confirmado') {
		respuesta(['ok' => false, 'mensaje' => 'El pedido debe estar confirmado antes de preparar.'], 422);
	}
	$pdo->prepare("UPDATE pedidos SET estado='preparando',fecha_preparando=NOW() WHERE id=?")->execute([$id]);
}
elseif ($accion === 'despachar') {
	if ($p['estado'] !== 'preparando') {
		respuesta(['ok' => false, 'mensaje' => 'El pedido debe estar en preparación.'], 422);
	}
	$guia = trim((string) ($d['numero_guia'] ?? ''));
	$pdo->prepare("UPDATE pedidos SET estado='en_camino',numero_guia=?,fecha_despacho=NOW() WHERE id=?")->execute([$guia ?: null, $id]);
}
elseif ($accion === 'entregar') {
	if ($p['estado'] !== 'en_camino') {
		respuesta(['ok' => false, 'mensaje' => 'El pedido debe estar en camino.'], 422);
	}
	$pdo->beginTransaction();
	$pdo->prepare("UPDATE pedidos SET estado='entregado',fecha_entrega=NOW() WHERE id=?")->execute([$id]);
	$pdo->prepare("UPDATE usuarios SET puntos_chay=puntos_chay + FLOOR((SELECT total FROM pedidos WHERE id=?)/1000) WHERE id=?")->execute([$id, $p['usuario_id']]);
	$pdo->commit();
}
elseif ($accion === 'cancelar') {
	$pdo->prepare("UPDATE pedidos SET estado='cancelado' WHERE id=? AND estado NOT IN ('entregado','cancelado')")->execute([$id]);
}
else {
	respuesta(['ok' => false, 'mensaje' => 'Acción inválida.'], 422);
}

respuesta(['ok' => true, 'mensaje' => 'Pedido actualizado.']);
