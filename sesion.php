<?php
require_once __DIR__ . '/../config/bootstrap.php';

if (!empty($_SESSION['usuario_id'])) {
	$st = $pdo->prepare("SELECT id,nombre,apellido,email,telefono,puntos_chay FROM usuarios WHERE id=?");
	$st->execute([(int) $_SESSION['usuario_id']]);
	$u = $st->fetch();

	respuesta(['ok' => true, 'autenticado' => (bool) $u, 'usuario' => $u ?: null]);
}

respuesta(['ok' => true, 'autenticado' => false, 'usuario' => null]);
