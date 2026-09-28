<?php
require_once __DIR__ . '/../config/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respuesta(['ok' => false, 'mensaje' => 'Método no permitido.'], 405);
}

$d = leerJson();
$email = strtolower(trim((string) ($d['email'] ?? '')));
$password = (string) ($d['password'] ?? '');

$st = $pdo->prepare("SELECT id,nombre,email,password_hash FROM admins WHERE email=? AND activo=1 LIMIT 1");
$st->execute([$email]);
$a = $st->fetch();

if (!$a || !password_verify($password, $a['password_hash'])) {
	respuesta(['ok' => false, 'mensaje' => 'Credenciales administrativas incorrectas.'], 401);
}

session_regenerate_id(true);
$_SESSION['admin_id'] = (int) $a['id'];
unset($_SESSION['usuario_id']);

unset($a['password_hash']);
respuesta(['ok' => true, 'admin' => $a]);
