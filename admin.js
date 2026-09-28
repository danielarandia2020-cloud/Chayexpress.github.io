async function cargarTodo() {
  try {
    const [statsData, productosData, categoriasData, clientesData, pedidosData] = await Promise.all([
      api("admin/dashboard.php"),
      api("admin/productos.php"),
      api("admin/categorias.php"),
      api("admin/clientes.php"),
      api("admin/pedidos.php")
    ]);

    stats.innerHTML = [["Clientes", statsData.stats.clientes], ["Productos activos", statsData.stats.productos], ["Pendientes", statsData.stats.pedidos_pendientes], ["Ventas", money(statsData.stats.ventas)]].map((item) => `
      <div class="col-6 col-lg-3">
        <div class="card p-3 shadow-sm">
          <small class="text-muted">${item[0]}</small>
          <strong class="fs-4">${item[1]}</strong>
        </div>
      </div>
    `).join("");

    pCategoria.innerHTML = '<option value="">Categoría</option>' + categoriasData.categorias.filter((item) => item.activa == 1).map((item) => `<option value="${item.slug}">${escA(item.nombre)}</option>`).join("");

    productosBody.innerHTML = productosData.productos.map((item) => `
      <tr>
        <td>${escA(item.nombre)}</td>
        <td>${escA(item.categoria_nombre)}</td>
        <td>
          <input class="form-control form-control-sm" style="max-width:120px" type="number" value="${item.precio}" onchange="editarProducto(${item.id},'precio',this.value)">
        </td>
        <td>
          <button class="btn btn-sm ${item.activo == 1 ? 'btn-success' : 'btn-secondary'}" onclick="editarProducto(${item.id},'activo',${item.activo == 1 ? 0 : 1})">
            ${item.activo == 1 ? 'Activo' : 'Agotado'}
          </button>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${item.id})">Eliminar</button>
        </td>
      </tr>
    `).join("");

    pedidosBody.innerHTML = pedidosData.pedidos.map((item) => `
      <tr>
        <td>#${item.id}</td>
        <td>
          ${escA(item.nombre)} ${escA(item.apellido)}<br>
          <small>${escA(item.email)}</small>
        </td>
        <td>${money(item.total)}</td>
        <td>
          ${item.metodo_pago}${item.tipo_transferencia ? ' / ' + item.tipo_transferencia : ''}<br>
          ${item.comprobante_imagen ? `<a target="_blank" href="../php/admin/ver_comprobante.php?id=${item.id}">Comprobante</a>` : '—'}
        </td>
        <td><span class="badge text-bg-${badge(item.estado)}">${item.estado.replaceAll('_', ' ')}</span></td>
        <td>${accionesPedido(item)}</td>
      </tr>
    `).join("");

    clientesBody.innerHTML = clientesData.clientes.map((item) => `
      <tr>
        <td>
          <strong>${escA(item.nombre)} ${escA(item.apellido)}</strong><br>
          <small>${escA(item.email)}</small>
        </td>
        <td>${escA(item.telefono || '—')}</td>
        <td>${item.compras}</td>
        <td>${money(item.total_compras)}</td>
        <td>${item.puntos_chay}</td>
      </tr>
    `).join("");
  } catch (error) {
    adminAlert.innerHTML = `<div class="alert alert-danger">${error.message}. Si acabas de abrir el panel, inicia sesión como admin.</div>`;
  }
}

function accionesPedido(estadoPedido) {
  const acciones = [];

  if (estadoPedido.estado === 'recibido' && estadoPedido.metodo_pago === 'transferencia' && estadoPedido.comprobante_imagen) {
    acciones.push(`<button class="btn btn-sm btn-success" onclick="accionPedido(${estadoPedido.id},'aprobar_pago')">Aprobar pago</button>`);
  }

  if (estadoPedido.estado === 'confirmado') {
    acciones.push(`<button class="btn btn-sm btn-primary" onclick="accionPedido(${estadoPedido.id},'preparar')">🖨 Imprimir ticket / Preparar</button>`);
  }

  if (estadoPedido.estado === 'preparando') {
    acciones.push(`<button class="btn btn-sm btn-primary" onclick="despachar(${estadoPedido.id})">Despachar</button>`);
  }

  if (estadoPedido.estado === 'en_camino') {
    acciones.push(`<button class="btn btn-sm btn-success" onclick="accionPedido(${estadoPedido.id},'entregar')">Marcar entregado</button>`);
  }

  return acciones.join(" ") || "—";
}

async function accionPedido(id, accion) {
  try {
    await api("admin/pedidos.php", { method: "POST", body: { id, accion } });
    cargarTodo();
  } catch (error) {
    alert(error.message);
  }
}

async function despachar(id) {
  const guia = prompt("Número de guía (opcional):", "");

  try {
    await api("admin/pedidos.php", {
      method: "POST",
      body: {
        id,
        accion: "despachar",
        numero_guia: guia || ""
      }
    });

    cargarTodo();
  } catch (error) {
    alert(error.message);
  }
}

async function editarProducto(id, campo, valor) {
  try {
    await api("admin/productos.php", {
      method: "PUT",
      body: {
        id,
        [campo]: campo === 'precio' ? Number(valor) : Boolean(Number(valor))
      }
    });
  } catch (error) {
    alert(error.message);
  }
}

async function eliminarProducto(id) {
  if (!confirm("El producto se marcará como no disponible.")) return;

  try {
    await api(`admin/productos.php?id=${id}`, { method: "DELETE" });
    cargarTodo();
  } catch (error) {
    alert(error.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  formProducto.onsubmit = async (event) => {
    event.preventDefault();

    try {
      const data = new FormData();
      data.append("nombre", pNombre.value);
      data.append("descripcion", pDescripcion.value);
      data.append("precio", pPrecio.value);
      data.append("categoria", pCategoria.value);
      data.append("imagen", pImagen.value);
      data.append("activo", pActivo.checked ? "1" : "0");

      if (pImagenArchivo.files[0]) {
        data.append("imagen_archivo", pImagenArchivo.files[0]);
      }

      await api("admin/productos.php", { method: "POST", body: data });
      event.target.reset();
      pActivo.checked = true;
      cargarTodo();
    } catch (error) {
      alert(error.message);
    }
  };

  formCategoria.onsubmit = async (event) => {
    event.preventDefault();

    try {
      await api("admin/categorias.php", {
        method: "POST",
        body: {
          nombre: cNombre.value,
          imagen: cImagen.value
        }
      });

      event.target.reset();
      cargarTodo();
    } catch (error) {
      alert(error.message);
    }
  };

  adminLogout.onclick = async () => {
    await api("admin/logout_admin.php", { method: "POST" });
    location.href = "admin-login.html";
  };

  cargarTodo();
  setInterval(cargarTodo, 20000);
});

function badge(state) {
  return state === 'entregado' ? 'success' : state === 'cancelado' ? 'danger' : state === 'en_camino' ? 'info' : state === 'preparando' ? 'warning' : 'secondary';
}

function escA(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

