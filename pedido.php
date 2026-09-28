<?php
require_once __DIR__ . '/config/bootstrap.php';
require_once __DIR__ . '/config/config.php';
$uid = usuarioId();
$method = $_SERVER['REQUEST_METHOD'];

function distanciaKm(float $lat1, float $lon1, float $lat2, float $lon2): float {
  $r = 6371;
  $dLat = deg2rad($lat2 - $lat1);
  $dLon = deg2rad($lon2 - $lon1);
  $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

  return 2 * $r * asin(min(1, sqrt($a)));
}

if ($method === 'GET') {
  $st = $pdo->prepare("SELECT p.*,d.etiqueta,d.direccion_texto,d.barrio,d.ciudad FROM pedidos p JOIN direcciones d ON d.id=p.direccion_id WHERE p.usuario_id=? ORDER BY p.id DESC");
  $st->execute([$uid]);
  $pedidos = $st->fetchAll();

  foreach ($pedidos as &$p) {
    $p['id'] = (int) $p['id'];
    $p['subtotal'] = (float) $p['subtotal'];
    $p['costo_domicilio'] = (float) $p['costo_domicilio'];
    $p['total'] = (float) $p['total'];

    $q = $pdo->prepare("SELECT nombre_producto,cantidad,precio_unitario,personalizacion FROM detalle_pedido WHERE pedido_id=?");
    $q->execute([$p['id']]);
    $p['items'] = $q->fetchAll();
  }

  respuesta(['ok' => true, 'pedidos' => $pedidos]);
}

$d = leerJson();

if ($method === 'POST' && (($d['accion'] ?? '') === 'calcular_domicilio')) {
  $direccionId = (int) ($d['direccion_id'] ?? 0);
  $st = $pdo->prepare("SELECT * FROM direcciones WHERE id=? AND usuario_id=?");
  $st->execute([$direccionId, $uid]);
  $dir = $st->fetch();

  if (!$dir) {
    respuesta(['ok' => false, 'mensaje' => 'Dirección inválida.'], 422);
  }

  $st = $pdo->prepare("SELECT SUM(cantidad*precio_unitario) FROM carrito_items ci JOIN carritos c ON c.id=ci.carrito_id WHERE c.usuario_id=?");
  $st->execute([$uid]);
  $subtotal = (float) $st->fetchColumn();

  $st = $pdo->prepare("SELECT puntos_chay FROM usuarios WHERE id=?");
  $st->execute([$uid]);
  $puntos = (int) $st->fetchColumn();

  $puntosUsados = max(0, min($puntos, (int) ($d['puntos_usados'] ?? 0)));
  $descuento = min($subtotal, $puntosUsados * 100);
  $dist = ($dir['latitud'] !== null && $dir['longitud'] !== null)
    ? distanciaKm(CHAY_LAT, CHAY_LNG, (float) $dir['latitud'], (float) $dir['longitud'])
    : 0;
  $dom = min($dist * TARIFA_POR_KM, $subtotal * TOPE_DOMICILIO_PORCENTAJE);

  respuesta([
    'ok' => true,
    'distancia_km' => round($dist, 2),
    'subtotal' => $subtotal,
    'puntos_disponibles' => $puntos,
    'puntos_usados' => $puntosUsados,
    'descuento_puntos' => $descuento,
    'costo_domicilio' => $dom,
    'total' => max(0, $subtotal - $descuento) + $dom,
    'tope' => $subtotal * TOPE_DOMICILIO_PORCENTAJE,
  ]);
}

if ($method === 'POST') {
  $direccionId = (int) ($d['direccion_id'] ?? 0);
  $metodo = (string) ($d['metodo_pago'] ?? '');
  $tipo = null;
  $puntosUsados = max(0, (int) ($d['puntos_usados'] ?? 0));

  if (!in_array($metodo, ['efectivo', 'transferencia'], true)) {
    respuesta(['ok' => false, 'mensaje' => 'Método de pago inválido.'], 422);
  }

  $pdo->beginTransaction();

  try {
    $st = $pdo->prepare("SELECT puntos_chay FROM usuarios WHERE id=? FOR UPDATE");
    $st->execute([$uid]);
    $puntosDisponibles = (int) $st->fetchColumn();
    if ($puntosUsados > $puntosDisponibles) {
      throw new Exception('No tienes suficientes puntos.');
    }

    $st = $pdo->prepare("SELECT * FROM direcciones WHERE id=? AND usuario_id=?");
    $st->execute([$direccionId, $uid]);
    $dir = $st->fetch();
    if (!$dir) {
      throw new Exception('Dirección inválida.');
    }

    $st = $pdo->prepare("SELECT ci.*,p.nombre,p.activo FROM carrito_items ci JOIN carritos c ON c.id=ci.carrito_id JOIN productos p ON p.id=ci.producto_id WHERE c.usuario_id=? FOR UPDATE");
    $st->execute([$uid]);
    $items = $st->fetchAll();
    if (!$items) {
      throw new Exception('El carrito está vacío.');
    }

    $subtotal = 0;
    foreach ($items as $i) {
      if (!$i['activo']) {
        throw new Exception('Hay un producto no disponible en el carrito.');
      }
      $subtotal += (float) $i['precio_unitario'] * (int) $i['cantidad'];
    }

    $dist = ($dir['latitud'] !== null && $dir['longitud'] !== null)
      ? distanciaKm(CHAY_LAT, CHAY_LNG, (float) $dir['latitud'], (float) $dir['longitud'])
      : 0;
    $descuento = min($subtotal, $puntosUsados * 100);
    $dom = min($dist * TARIFA_POR_KM, $subtotal * TOPE_DOMICILIO_PORCENTAJE);
    $total = max(0, $subtotal - $descuento) + $dom;
    $estado = 'confirmado';
    $pagoAprobado = 1;

    $st = $pdo->prepare("INSERT INTO pedidos(usuario_id,direccion_id,subtotal,descuento_puntos,puntos_usados,costo_domicilio,total,distancia_km,metodo_pago,tipo_transferencia,estado,pago_aprobado,fecha_confirmacion) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,IF(?=1,NOW(),NULL))");
    $st->execute([$uid, $direccionId, $subtotal, $descuento, $puntosUsados, $dom, $total, $dist, $metodo, $tipo, $estado, $pagoAprobado, $pagoAprobado]);
    $pedidoId = (int) $pdo->lastInsertId();

    $ins = $pdo->prepare("INSERT INTO detalle_pedido(pedido_id,producto_id,nombre_producto,cantidad,precio_unitario,personalizacion) VALUES(?,?,?,?,?,?)");
    foreach ($items as $i) {
      $ins->execute([$pedidoId, $i['producto_id'], $i['nombre'], (int) $i['cantidad'], $i['precio_unitario'], $i['personalizacion']]);
    }

    $pdo->prepare("DELETE ci FROM carrito_items ci JOIN carritos c ON c.id=ci.carrito_id WHERE c.usuario_id=?")->execute([$uid]);
    $puntosGanados = 0;
    foreach ($items as $i) {
      $puntosGanados += 10 * (int) $i['cantidad'];
    }

    $pdo->prepare("UPDATE usuarios SET puntos_chay=puntos_chay-?+? WHERE id=?")->execute([$puntosUsados, $puntosGanados, $uid]);
    $pdo->commit();

    respuesta([
      'ok' => true,
      'pedido_id' => $pedidoId,
      'estado' => $estado,
      'subtotal' => $subtotal,
      'descuento_puntos' => $descuento,
      'puntos_usados' => $puntosUsados,
      'puntos_ganados' => $puntosGanados,
      'costo_domicilio' => $dom,
      'total' => $total,
      'distancia_km' => round($dist, 2),
    ]);
  } catch (Throwable $e) {
    $pdo->rollBack();
    respuesta(['ok' => false, 'mensaje' => $e->getMessage()], 422);
  }
}

respuesta(['ok' => false, 'mensaje' => 'Método no permitido.'], 405);
