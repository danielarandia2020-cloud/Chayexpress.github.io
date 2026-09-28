<?php
require_once __DIR__ . '/config/bootstrap.php';
$uid = usuarioId();
$st = $pdo->prepare("INSERT IGNORE INTO carritos(usuario_id) VALUES(?)");
$st->execute([$uid]);
$st = $pdo->prepare("SELECT id FROM carritos WHERE usuario_id=?");
$st->execute([$uid]);
$cartId = (int) $st->fetchColumn();

function carritoCompleto(PDO $pdo, int $cartId): array {
  $st = $pdo->prepare("SELECT ci.id,ci.producto_id,ci.cantidad,ci.personalizacion,ci.precio_unitario,p.nombre,p.imagen,p.activo FROM carrito_items ci JOIN productos p ON p.id=ci.producto_id WHERE ci.carrito_id=? ORDER BY ci.id");
  $st->execute([$cartId]);
  $items = $st->fetchAll();
  $subtotal = 0;
  $cantidad = 0;

  foreach ($items as &$i) {
    $i['precio_unitario'] = (float) $i['precio_unitario'];
    $i['cantidad'] = (int) $i['cantidad'];
    $i['subtotal'] = $i['cantidad'] * $i['precio_unitario'];
    $subtotal += $i['subtotal'];
    $cantidad += $i['cantidad'];
  }

  return ['items' => $items, 'subtotal' => $subtotal, 'cantidad' => $cantidad];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  respuesta(['ok' => true, 'carrito' => carritoCompleto($pdo, $cartId)]);
}

$d = leerJson();

if ($method === 'POST') {
  $pid = (int) ($d['producto_id'] ?? 0);
  $qty = max(1, (int) ($d['cantidad'] ?? 1));
  $persData = $d['personalizacion'] ?? null;
  $pers = jsonPersonalizacion($persData);

  $st = $pdo->prepare("SELECT precio,activo FROM productos WHERE id=?");
  $st->execute([$pid]);
  $p = $st->fetch();
  $precio = (float) $p['precio'];

  if (is_array($persData)) {
    $ads = $persData['adiciones'] ?? [];
    foreach ($ads as $a) {
      if (in_array($a, ['queso', 'extra_queso'], true)) {
        $precio += 3000;
      } elseif (in_array($a, ['carne', 'extra_carne'], true)) {
        $precio += 6000;
      } elseif ($a === 'tocineta') {
        $precio += 4000;
      }
    }

    foreach (($persData['extras'] ?? []) as $extra) {
      $nombre = is_array($extra) ? ($extra['nombre'] ?? '') : $extra;
      if ($nombre === 'queso') {
        $precio += 3000;
      } elseif ($nombre === 'carne') {
        $precio += 6000;
      } elseif ($nombre === 'tocineta') {
        $precio += 4000;
      } elseif (in_array($nombre, ['pollo', 'pepperoni'], true)) {
        $precio += 5000;
      }
    }

    if (($persData['tamano'] ?? 'normal') === 'grande') {
      $precio += 5000;
    }
  }

  if (!$p || !$p['activo']) {
    respuesta(['ok' => false, 'mensaje' => 'Producto no disponible.'], 422);
  }

  // Merge only exact same personalization JSON.
  $st = $pdo->prepare("SELECT id,cantidad FROM carrito_items WHERE carrito_id=? AND producto_id=? AND COALESCE(personalizacion,'')=COALESCE(?, '') LIMIT 1");
  $st->execute([$cartId, $pid, $pers]);
  $row = $st->fetch();

  if ($row) {
    $pdo->prepare("UPDATE carrito_items SET cantidad=cantidad+? WHERE id=?")->execute([$qty, $row['id']]);
  } else {
    $pdo->prepare("INSERT INTO carrito_items(carrito_id,producto_id,cantidad,personalizacion,precio_unitario) VALUES(?,?,?,?,?)")->execute([$cartId, $pid, $qty, $pers, $precio]);
  }

  respuesta(['ok' => true, 'carrito' => carritoCompleto($pdo, $cartId)]);
}

if ($method === 'PUT') {
  $id = (int) ($d['id'] ?? 0);
  $qty = max(1, (int) ($d['cantidad'] ?? 1));
  $st = $pdo->prepare("UPDATE carrito_items SET cantidad=? WHERE id=? AND carrito_id=?");
  $st->execute([$qty, $id, $cartId]);
  respuesta(['ok' => true, 'carrito' => carritoCompleto($pdo, $cartId)]);
}

if ($method === 'DELETE') {
  $id = (int) ($_GET['id'] ?? 0);
  $pdo->prepare("DELETE FROM carrito_items WHERE id=? AND carrito_id=?")->execute([$id, $cartId]);
  respuesta(['ok' => true, 'carrito' => carritoCompleto($pdo, $cartId)]);
}
