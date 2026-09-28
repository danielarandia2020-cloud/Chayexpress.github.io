<?php
require_once __DIR__ . '/config/bootstrap.php';
require_once __DIR__ . '/config/config.php';

$uid = usuarioId();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respuesta(['ok' => false, 'mensaje' => 'Método no permitido.'], 405);
}

$pedidoId = (int) ($_POST['pedido_id'] ?? 0);
$st = $pdo->prepare("SELECT id FROM pedidos WHERE id=? AND usuario_id=? AND metodo_pago='transferencia'");
$st->execute([$pedidoId, $uid]);

if (!$st->fetch()) {
	respuesta(['ok' => false, 'mensaje' => 'Pedido no válido.'], 404);
}

if (empty($_FILES['comprobante']) || $_FILES['comprobante']['error'] !== UPLOAD_ERR_OK) {
	respuesta(['ok' => false, 'mensaje' => 'Selecciona una imagen válida.'], 422);
}

$f = $_FILES['comprobante'];
$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);

if (!isset($allowed[$mime]) || $f['size'] > 5 * 1024 * 1024) {
	respuesta(['ok' => false, 'mensaje' => 'Solo JPG, PNG o WEBP de máximo 5 MB.'], 422);
}

if (!is_dir(RUTA_COMPROBANTES)) {
	mkdir(RUTA_COMPROBANTES, 0755, true);
}

$name = 'pedido_' . $pedidoId . '_' . bin2hex(random_bytes(6)) . '.' . $allowed[$mime];
$dest = RUTA_COMPROBANTES . $name;

if (!move_uploaded_file($f['tmp_name'], $dest)) {
	respuesta(['ok' => false, 'mensaje' => 'No se pudo guardar el comprobante.'], 500);
}

$pdo->prepare("UPDATE pedidos SET comprobante_imagen=? WHERE id=? AND usuario_id=?")->execute([$name, $pedidoId, $uid]);
respuesta(['ok' => true, 'mensaje' => 'Comprobante enviado. Quedará pendiente de aprobación.', 'archivo' => URL_COMPROBANTES . $name]);
