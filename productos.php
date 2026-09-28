<?php
require_once __DIR__ . '/../config/bootstrap.php';
adminId();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $st = $pdo->query("SELECT p.*,c.nombre categoria_nombre,c.slug categoria FROM productos p JOIN categorias c ON c.id=p.categoria_id ORDER BY p.id DESC");
    respuesta(['ok' => true, 'productos' => $st->fetchAll()]);
}
$d = $method === 'POST' ? ($_POST ?: leerJson()) : leerJson();

if ($method === 'POST') {
    $nombre = trim((string) ($d['nombre'] ?? ''));
    $desc = trim((string) ($d['descripcion'] ?? ''));
    $precio = (float) ($d['precio'] ?? 0);
    $cat = (string) ($d['categoria'] ?? '');
    $imagen = trim((string) ($d['imagen'] ?? ''));

    if (!empty($_FILES['imagen_archivo']) && $_FILES['imagen_archivo']['error'] === UPLOAD_ERR_OK) {
        $f = $_FILES['imagen_archivo'];
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
        $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$mime] ?? null;

        if (!$ext || $f['size'] > 5 * 1024 * 1024) {
            respuesta(['ok' => false, 'mensaje' => 'Imagen inválida o mayor de 5 MB.'], 422);
        }

        $dir = __DIR__ . '/../../uploads/productos/';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $name = 'producto_' . bin2hex(random_bytes(6)) . '.' . $ext;
        if (!move_uploaded_file($f['tmp_name'], $dir . $name)) {
            respuesta(['ok' => false, 'mensaje' => 'No se pudo guardar la imagen.'], 500);
        }

        $imagen = '../uploads/productos/' . $name;
    }

    $activo = !empty($d['activo']) ? 1 : 0;
    $st = $pdo->prepare("SELECT id FROM categorias WHERE slug=?");
    $st->execute([$cat]);
    $cid = $st->fetchColumn();

    if (!$cid || $nombre === '' || $precio < 0) {
        respuesta(['ok' => false, 'mensaje' => 'Datos inválidos.'], 422);
    }

    $slug = slugify($nombre) . '-' . bin2hex(random_bytes(2));
    $st = $pdo->prepare("INSERT INTO productos(categoria_id,slug,nombre,descripcion,precio,imagen,activo) VALUES(?,?,?,?,?,?,?)");
    $st->execute([$cid, $slug, $nombre, $desc, $precio, $imagen ?: null, $activo]);

    respuesta(['ok' => true, 'id' => (int) $pdo->lastInsertId()]);
}

if ($method === 'PUT') {
    $id = (int) ($d['id'] ?? 0);
    if (!$id) {
        respuesta(['ok' => false, 'mensaje' => 'ID requerido.'], 422);
    }

    $fields = [];
    $params = [];
    foreach (['nombre', 'descripcion', 'imagen'] as $f) {
        if (array_key_exists($f, $d)) {
            $fields[] = "$f=?";
            $params[] = $d[$f];
        }
    }

    if (array_key_exists('precio', $d)) {
        $fields[] = 'precio=?';
        $params[] = (float) $d['precio'];
    }

    if (array_key_exists('activo', $d)) {
        $fields[] = 'activo=?';
        $params[] = !empty($d['activo']) ? 1 : 0;
    }

    if (array_key_exists('categoria', $d)) {
        $st = $pdo->prepare("SELECT id FROM categorias WHERE slug=?");
        $st->execute([$d['categoria']]);
        $cid = $st->fetchColumn();
        if (!$cid) {
            respuesta(['ok' => false, 'mensaje' => 'Categoría inválida.'], 422);
        }
        $fields[] = 'categoria_id=?';
        $params[] = $cid;
    }

    if (!$fields) {
        respuesta(['ok' => false, 'mensaje' => 'Sin cambios.'], 422);
    }

    $params[] = $id;
    $pdo->prepare("UPDATE productos SET " . implode(',', $fields) . " WHERE id=?")->execute($params);
    respuesta(['ok' => true]);
}

if ($method === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) {
        respuesta(['ok' => false, 'mensaje' => 'ID requerido.'], 422);
    }

    // Soft delete: preserves order history.
    $pdo->prepare("UPDATE productos SET activo=0 WHERE id=?")->execute([$id]);
    respuesta(['ok' => true]);
}

respuesta(['ok' => false, 'mensaje' => 'Método no permitido.'], 405);
