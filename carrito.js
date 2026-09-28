let chayCarritoModal, chayCheckoutModal;

document.addEventListener("DOMContentLoaded", () => {
  construirCarrito();
  actualizarCarrito().catch(() => {});

  document.getElementById("botonCarrito")?.addEventListener("click", async (event) => {
    event.preventDefault();
    await abrirCarrito();
  });
});

function construirCarrito() {
  if (document.getElementById("modalCarrito")) return;

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="modal fade" id="modalCarrito" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">🛒 Tu carrito</h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="carritoContenido"></div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Seguir comprando</button>
            <button class="btn btn-primary" id="btnCheckout">Continuar compra</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(wrap);
  chayCarritoModal = new bootstrap.Modal(document.getElementById("modalCarrito"));
  document.getElementById("btnCheckout").onclick = abrirCheckout;
}

async function abrirCarrito() {
  try {
    const ses = await api("auth/sesion.php");

    if (!ses.autenticado) {
      alert("Inicia sesión para usar tu carrito persistente.");
      location.href = "inicio_sesion.html";
      return;
    }

    await actualizarCarrito();
    chayCarritoModal.show();
  } catch (error) {
    alert(error.message);
  }
}

window.abrirCarrito = abrirCarrito;

async function actualizarCarrito() {
  try {
    const d = await api("carrito.php");
    window.chayCarrito = d.carrito;
    actualizarContadorCarrito(d.carrito.items);

    const carritoContenido = document.getElementById("carritoContenido");
    if (!carritoContenido) return;

    if (!d.carrito.items.length) {
      carritoContenido.innerHTML = '<div class="text-center py-5 text-muted"><i class="bi bi-cart-x fs-1"></i><p class="mt-2">Tu carrito está vacío.</p></div>';
      document.getElementById("btnCheckout").disabled = true;
      return;
    }

    document.getElementById("btnCheckout").disabled = false;
    carritoContenido.innerHTML = d.carrito.items.map((item) => `
      <div class="d-flex gap-3 align-items-center border-bottom py-3">
        <img src="${item.imagen || ""}" style="width:72px;height:72px;object-fit:cover;border-radius:12px">
        <div class="flex-grow-1">
          <strong>${esc2(item.nombre)}</strong>
          <div class="small text-muted">${item.personalizacion || ""}</div>
          <div>${money(item.precio_unitario)}</div>
        </div>
        <div class="input-group" style="width:125px">
          <button class="btn btn-outline-secondary" data-minus="${item.id}">−</button>
          <input class="form-control text-center" value="${item.cantidad}" data-qty="${item.id}">
          <button class="btn btn-outline-secondary" data-plus="${item.id}">+</button>
        </div>
        <strong style="min-width:90px;text-align:right">${money(item.subtotal)}</strong>
        <button class="btn btn-sm btn-outline-danger" data-del="${item.id}"><i class="bi bi-trash"></i></button>
      </div>
    `).join("") + `<div class="text-end pt-3"><strong>Subtotal: ${money(d.carrito.subtotal)}</strong></div>`;

    carritoContenido.querySelectorAll("[data-plus]").forEach((button) => {
      button.onclick = () => cambiarCantidad(button.dataset.plus, 1);
    });

    carritoContenido.querySelectorAll("[data-minus]").forEach((button) => {
      button.onclick = () => cambiarCantidad(button.dataset.minus, -1);
    });

    carritoContenido.querySelectorAll("[data-del]").forEach((button) => {
      button.onclick = () => eliminarItem(button.dataset.del);
    });
  } catch (error) {
    document.getElementById("carritoContenido").innerHTML = `<p class="text-danger">${error.message}</p>`;
  }
}

function actualizarContadorCarrito(items = []) {
  const boton = document.getElementById("botonCarrito");
  if (!boton) return;

  let contador = boton.querySelector(".carrito-contador");
  if (!contador) {
    contador = document.createElement("span");
    contador.className = "carrito-contador badge rounded-pill bg-warning text-dark";
    boton.appendChild(contador);
  }

  const cantidad = items.reduce((total, item) => total + Number(item.cantidad || 0), 0);
  contador.textContent = cantidad;
  contador.classList.toggle("d-none", cantidad === 0);
}

async function cambiarCantidad(id, delta) {
  const input = document.querySelector(`[data-qty="${id}"]`);
  const nuevoValor = Math.max(1, Number(input.value) + delta);

  await api("carrito.php", {
    method: "PUT",
    body: {
      id: Number(id),
      cantidad: nuevoValor
    }
  });

  actualizarCarrito();
}

async function eliminarItem(id) {
  await api(`carrito.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  actualizarCarrito();
}

async function agregarProductoRapido(producto) {
  try {
    await api("carrito.php", {
      method: "POST",
      body: {
        producto_id: Number(producto.id),
        cantidad: 1,
        personalizacion: {}
      }
    });

    await actualizarCarrito();
    mostrarConfirmacionRapida(producto);
  } catch (error) {
    alert(error.message || "No se pudo agregar el producto al carrito.");
  }
}

window.agregarProductoRapido = agregarProductoRapido;

function mostrarConfirmacionRapida(producto) {
  let modal = document.getElementById("modalProductoRapido");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modalProductoRapido";
    modal.className = "modal fade";
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5">Producto agregado</h2>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body d-flex gap-3 align-items-center">
            <img id="productoRapidoImagen" class="rounded" style="width:82px;height:82px;object-fit:cover" alt="">
            <div>
              <strong id="productoRapidoNombre"></strong>
              <p class="mb-0 text-muted">Cantidad: 1</p>
              <p class="mb-0 fw-bold" id="productoRapidoPrecio"></p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Seguir comprando</button>
            <button type="button" class="btn btn-cta" id="productoRapidoIrCarrito">Ir al carrito</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#productoRapidoIrCarrito").addEventListener("click", () => {
      bootstrap.Modal.getInstance(modal)?.hide();
      abrirCarrito();
    });
  }

  modal.querySelector("#productoRapidoImagen").src = producto.imagen || "../img/isotipo.png";
  modal.querySelector("#productoRapidoImagen").alt = producto.nombre;
  modal.querySelector("#productoRapidoNombre").textContent = producto.nombre;
  modal.querySelector("#productoRapidoPrecio").textContent = money(producto.precio);

  bootstrap.Modal.getOrCreateInstance(modal).show();
}

async function abrirCheckout() {
  try {
    const s = await api("auth/sesion.php");

    if (!s.autenticado) {
      alert("Inicia sesión para finalizar la compra.");
      location.href = "inicio_sesion.html";
      return;
    }

    await cargarCheckout();
    chayCarritoModal.hide();
    chayCheckoutModal = new bootstrap.Modal(document.getElementById("modalCheckout"));
    chayCheckoutModal.show();
  } catch (error) {
    alert(error.message);
  }
}

let checkoutPaso = 1;

async function cargarCheckout() {
  let modal = document.getElementById("modalCheckout");

  if (!modal) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="modal fade" id="modalCheckout" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="checkoutTitulo">1. Dirección de entrega</h5>
              <button class="btn-close" id="cerrarCheckout"></button>
            </div>
            <div class="modal-body">
              <div id="checkoutMensaje"></div>
              <div id="checkoutDireccion"></div>
              <div id="checkoutPago" class="d-none"></div>
              <div id="checkoutResumen"></div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary d-none" id="checkoutAtras">Atrás</button>
              <button class="btn btn-primary" id="checkoutSiguiente">Siguiente</button>
              <button class="btn btn-primary d-none" id="confirmarPedido">Confirmar pedido</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);
    modal = document.getElementById("modalCheckout");
    chayCheckoutModal = new bootstrap.Modal(modal);

    document.getElementById("cerrarCheckout").onclick = cerrarCheckout;
    document.getElementById("checkoutSiguiente").onclick = () => {
      if (checkoutPaso === 1) {
        if (!document.querySelector('input[name="checkoutDireccion"]:checked')) {
          alert("Selecciona una dirección.");
          return;
        }
        checkoutPaso = 2;
        mostrarPasoCheckout();
      } else {
        confirmarPedido();
      }
    };

    document.getElementById("checkoutAtras").onclick = () => {
      checkoutPaso = 1;
      mostrarPasoCheckout();
    };

    document.getElementById("confirmarPedido").onclick = confirmarPedido;
  }

  checkoutPaso = 1;
  document.getElementById("checkoutMensaje").innerHTML = "";
  document.getElementById("confirmarPedido").disabled = false;
  document.getElementById("confirmarPedido").textContent = "Confirmar pedido";

  const d = await api("direcciones.php");
  const dirs = d.direcciones;

  document.getElementById("checkoutDireccion").innerHTML = dirs.length
    ? dirs.map((direccion) => `
        <label class="border rounded p-3 d-block mb-2">
          <input type="radio" name="checkoutDireccion" value="${direccion.id}" ${direccion.predeterminada == 1 ? "checked" : ""}>
          <strong>${esc2(direccion.etiqueta)}</strong><br>
          <small>${esc2(direccion.direccion_texto)} · ${esc2(direccion.barrio || "")} · ${esc2(direccion.localidad || direccion.ciudad || "")}</small>
        </label>
      `).join("") + '<button class="btn btn-sm btn-outline-secondary" onclick="location.href=\'cuenta.html\'">+ Agregar dirección</button>'
    : '<p class="text-muted">No tienes direcciones.</p>';

  document.getElementById("checkoutPago").innerHTML = `
    <label class="border rounded p-3 d-block mb-2">
      <input type="radio" name="checkoutPago" value="efectivo"> Efectivo
    </label>
    <label class="border rounded p-3 d-block">
      <input type="radio" name="checkoutPago" value="transferencia"> Transferencia
    </label>
    <div id="selectorPuntosCheckout" class="mt-4"></div>
  `;

  document.querySelectorAll('input[name="checkoutDireccion"]').forEach((input) => {
    input.onchange = calcularCheckout;
  });

  document.getElementById("checkoutPago").querySelectorAll('input[name="checkoutPago"]').forEach((input) => {
    input.onchange = calcularCheckout;
  });

  mostrarPasoCheckout();
  await calcularCheckout();
}

function mostrarPasoCheckout() {
  const direccion = document.getElementById("checkoutDireccion");
  const pago = document.getElementById("checkoutPago");
  const titulo = document.getElementById("checkoutTitulo");
  const siguiente = document.getElementById("checkoutSiguiente");
  const atras = document.getElementById("checkoutAtras");
  const confirmar = document.getElementById("confirmarPedido");
  const esDireccion = checkoutPaso === 1;

  titulo.textContent = esDireccion ? "1. Dirección de entrega" : "2. Método de pago";
  direccion.classList.toggle("d-none", !esDireccion);
  pago.classList.toggle("d-none", esDireccion);
  atras.classList.toggle("d-none", esDireccion);
  siguiente.classList.toggle("d-none", !esDireccion);
  confirmar.classList.toggle("d-none", esDireccion);
  document.getElementById("checkoutResumen").classList.toggle("d-none", esDireccion);
}

async function calcularCheckout() {
  const id = document.querySelector('input[name="checkoutDireccion"]:checked')?.value;

  if (!id) {
    document.getElementById("checkoutResumen").innerHTML = '<p class="text-warning">Selecciona una dirección.</p>';
    return;
  }

  try {
    const puntosUsados = Number(document.getElementById("puntosUsados")?.value || 0);
    const d = await api("pedido.php", {
      method: "POST",
      body: {
        accion: "calcular_domicilio",
        direccion_id: Number(id),
        puntos_usados: puntosUsados
      }
    });

    const selector = document.getElementById("selectorPuntosCheckout");
    if (selector && !document.getElementById("puntosUsados")) {
      selector.innerHTML = `
        <label for="puntosUsados" class="form-label fw-bold">Usar puntos CHAY</label>
        <input id="puntosUsados" class="form-range" type="range" min="0" max="${d.puntos_disponibles}" value="${puntosUsados}">
        <div class="small text-muted">
          <span id="puntosUsadosTexto">${puntosUsados}</span> puntos = <span id="descuentoPuntosTexto">${money(d.descuento_puntos)}</span> de descuento
        </div>
      `;
      document.getElementById("puntosUsados").addEventListener("input", calcularCheckout);
    }

    if (document.getElementById("puntosUsados")) {
      document.getElementById("puntosUsados").max = d.puntos_disponibles;
      document.getElementById("puntosUsadosTexto").textContent = d.puntos_usados;
      document.getElementById("descuentoPuntosTexto").textContent = money(d.descuento_puntos);
    }

    document.getElementById("checkoutResumen").innerHTML = `
      <h6>3. Resumen</h6>
      <div class="d-flex justify-content-between"><span>Subtotal</span><span>${money(d.subtotal)}</span></div>
      <div class="d-flex justify-content-between"><span>Descuento por puntos</span><span>- ${money(d.descuento_puntos)}</span></div>
      <div class="d-flex justify-content-between"><span>Domicilio (${d.distancia_km} km, máximo 5%)</span><span>${money(d.costo_domicilio)}</span></div>
      <div class="d-flex justify-content-between fs-5 fw-bold"><span>Total</span><span>${money(d.total)}</span></div>
    `;
  } catch (error) {
    document.getElementById("checkoutResumen").innerHTML = `<p class="text-danger">${error.message}</p>`;
  }
}

async function confirmarPedido() {
  const direccion = document.querySelector('input[name="checkoutDireccion"]:checked')?.value;
  const metodo = document.querySelector('input[name="checkoutPago"]:checked')?.value;
  const puntosUsados = Number(document.getElementById("puntosUsados")?.value || 0);

  if (!direccion) {
    alert("Selecciona una dirección.");
    return;
  }

  if (!metodo) {
    alert("Selecciona un método de pago.");
    return;
  }

  try {
    const d = await api("pedido.php", {
      method: "POST",
      body: {
        direccion_id: Number(direccion),
        metodo_pago: metodo,
        puntos_usados: puntosUsados
      }
    });

    document.getElementById("checkoutMensaje").innerHTML = `
      <div class="alert alert-success">Pedido #${d.pedido_id} confirmado. Total: ${money(d.total)}. Ganaste ${d.puntos_ganados} puntos.</div>
    `;
    document.getElementById("confirmarPedido").disabled = true;
    setTimeout(() => location.href = "cuenta.html#pedidos", 700);
  } catch (error) {
    alert(error.message);
  }
}

function cerrarCheckout() {
  chayCheckoutModal?.hide();
}

function esc2(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}
