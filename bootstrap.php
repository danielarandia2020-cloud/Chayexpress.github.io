<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

function respuesta(array $data, int $status=200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function leerJson(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}
function usuarioId(): int {
    if (empty($_SESSION['usuario_id'])) respuesta(['ok'=>false,'mensaje'=>'Debes iniciar sesión.'],401);
    return (int)$_SESSION['usuario_id'];
}
function adminId(): int {
    if (empty($_SESSION['admin_id'])) respuesta(['ok'=>false,'mensaje'=>'Acceso administrativo requerido.'],401);
    return (int)$_SESSION['admin_id'];
}
function esAdmin(): bool { return !empty($_SESSION['admin_id']); }
function slugify(string $text): string {
    $text = iconv('UTF-8','ASCII//TRANSLIT',$text) ?: $text;
    $text = strtolower($text);
    $text = preg_replace('/[^a-z0-9]+/','-', $text);
    return trim($text,'-');
}
function jsonPersonalizacion(mixed $v): ?string {
    if ($v === null || $v === '') return null;
    if (is_string($v)) {
        json_decode($v, true);
        if (json_last_error() === JSON_ERROR_NONE) return $v;
    }
    return json_encode($v, JSON_UNESCAPED_UNICODE);
}
