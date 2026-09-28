<?php
require_once __DIR__ . '/../config/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	header('Content-Type:text/html; charset=utf-8');
	echo '<h2>Crear administrador inicial</h2><form method="post"><input name="nombre" placeholder="Nombre" required><br><input name="email" type="email" placeholder="Correo" required><br><input name="password" type="password" placeholder="Contraseña (mín. 6)" required><br><button>Crear</button></form><p>Elimina o renombra este archivo después de crear el admin.</p>';
	exit;
}

$nombre = trim((string) ($_POST['nombre'] ?? ''));
$email = strtolower(trim((string) ($_POST['email'] ?? '')));
$password = (string) ($_POST['password'] ?? '');

if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
	die('Datos inválidos.');
}

try {
	$st = $pdo->prepare("INSERT INTO admins(nombre,email,password_hash) VALUES(?,?,?)");
	$st->execute([$nombre, $email, password_hash($password, PASSWORD_DEFAULT)]);
	echo 'Administrador creado. Elimina o protege crear_admin.php antes de continuar.';
} catch (PDOException $e) {
	echo 'No se pudo crear: ' . htmlspecialchars($e->getMessage());
}
