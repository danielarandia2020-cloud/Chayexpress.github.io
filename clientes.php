<?php
require_once __DIR__ . '/../config/bootstrap.php';
adminId();

$st = $pdo->query("SELECT u.id,u.nombre,u.apellido,u.email,u.telefono,u.puntos_chay,u.fecha_registro,COUNT(p.id) compras,COALESCE(SUM(CASE WHEN p.estado<>'cancelado' THEN p.total ELSE 0 END),0) total_compras FROM usuarios u LEFT JOIN pedidos p ON p.usuario_id=u.id GROUP BY u.id ORDER BY u.id DESC");
$clientes = $st->fetchAll();

foreach ($clientes as &$c) {
	$q = $pdo->prepare("SELECT id,total,estado,metodo_pago,fecha_creacion FROM pedidos WHERE usuario_id=? ORDER BY id DESC");
	$q->execute([$c['id']]);
	$c['historial'] = $q->fetchAll();
}

respuesta(['ok' => true, 'clientes' => $clientes]);
