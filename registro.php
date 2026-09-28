<?php
require_once __DIR__ . '/../config/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respuesta(['ok' => false, 'mensaje' => 'Método no permitido.'], 405);
}

$d = leerJson();
$nombre = trim((string) ($d['nombre'] ?? ''));
$apellido = trim((string) ($d['apellido'] ?? ''));
$email = strtolower(trim((string) ($d['email'] ?? '')));
$telefono = trim((string) ($d['telefono'] ?? ''));
$password = (string) ($d['password'] ?? '');

if ($nombre === '' || $apellido === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
    respuesta(['ok' => false, 'mensaje' => 'Completa los campos y usa una contraseña de mínimo 6 caracteres.'], 422);
}

try {
    $st = $pdo->prepare("INSERT INTO usuarios(nombre,apellido,email,password_hash,telefono,puntos_chay) VALUES(?,?,?,?,?,10)");
    $st->execute([$nombre, $apellido, $email, password_hash($password, PASSWORD_DEFAULT), $telefono ?: null]);
    $id = (int) $pdo->lastInsertId();
    $pdo->prepare("INSERT INTO carritos(usuario_id) VALUES(?)")->execute([$id]);

    session_regenerate_id(true);
    $_SESSION['usuario_id'] = $id;
    unset($_SESSION['admin_id']);

    respuesta([
        'ok' => true,
        'mensaje' => 'Registro exitoso.',
        'usuario' => ['id' => $id, 'nombre' => $nombre, 'apellido' => $apellido, 'email' => $email]
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        respuesta(['ok' => false, 'mensaje' => 'Ese correo ya está registrado.'], 409);
    }

    respuesta(['ok' => false, 'mensaje' => 'No fue posible registrar el usuario.'], 500);
}
