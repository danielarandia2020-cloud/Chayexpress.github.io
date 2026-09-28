<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/../config/db.php';

if (empty($_SESSION['admin_id'])) {
	http_response_code(403);
	exit('Acceso denegado');
}

$id = (int) ($_GET['id'] ?? 0);
$st = $pdo->prepare("SELECT comprobante_imagen FROM pedidos WHERE id=?");
$st->execute([$id]);
$name = $st->fetchColumn();

if (!$name) {
	http_response_code(404);
	exit('No encontrado');
}

$base = realpath(__DIR__ . '/../../uploads/comprobantes/');
$file = realpath($base . '/' . $name);

if (!$file || strpos($file, $base) !== 0 || !is_file($file)) {
	http_response_code(404);
	exit('No encontrado');
}

$mime = (new finfo(FILEINFO_MIME_TYPE))->file($file);
if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
	http_response_code(415);
	exit('Tipo no permitido');
}

header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($file));
readfile($file);
