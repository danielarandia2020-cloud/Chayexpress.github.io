<?php
require_once __DIR__ . '/../config/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respuesta(['ok' => false, 'mensaje' => 'Método no permitido.'], 405);
}

$d = leerJson();
$email = strtolower(trim((string) ($d['email'] ?? $d['usuario'] ?? '')));
$password = (string) ($d['password'] ?? $d['contrasena'] ?? '');

$st = $pdo->prepare("SELECT id,nombre,apellido,email,password_hash,telefono,puntos_chay FROM usuarios WHERE email=? LIMIT 1");
$st->execute([$email]);
$u = $st->fetch();

if (!$u || !password_verify($password, $u['password_hash'])) {
	respuesta(['ok' => false, 'mensaje' => 'Correo o contraseña incorrectos.'], 401);
}

session_regenerate_id(true);
$_SESSION['usuario_id'] = (int) $u['id'];
unset($_SESSION['admin_id']);

unset($u['password_hash']);
respuesta(['ok' => true, 'usuario' => $u]);
