async function cargarCuenta() {
  try {
    const perfil = await api("perfil.php");
    const usuario = perfil.usuario;
    perfilNombre.value = usuario.nombre;
    perfilApellido.value = usuario.apellido;
    perfilEmail.value = usuario.email;
    perfilTelefono.value = usuario.telefono || "";
    puntosChay.textContent = usuario.puntos_chay;

    const direcciones = await api("direcciones.php");
    listaDirecciones.innerHTML = direcciones.direcciones.length
      ? direcciones.direcciones.map((direccion) => `
          <div class="border rounded p-3 mb-2 d-flex justify-content-between">
            <span>
              <strong>${escC(direccion.etiqueta)}</strong>
              ${direccion.predeterminada == 1 ? '<span class="badge text-bg-warning">Principal</span>' : ""}
              <br>${escC(direccion.direccion_texto)}
              <br>Barrio: ${escC(direccion.barrio || "")} · Localidad: ${escC(direccion.localidad || direccion.ciudad || "")}
              <br>${escC(direccion.tipo_inmueble || "")} ${escC(direccion.detalle_inmueble || "")}
              ${direccion.torre ? `· Torre: ${escC(direccion.torre)}` : ""}
              ${direccion.apartamento ? `· Apto: ${escC(direccion.apartamento)}` : ""}
              ${direccion.indicaciones ? `<br><small>${escC(direccion.indicaciones)}</small>` : ""}
            </span>
            <button class="btn btn-sm btn-outline-danger" onclick="borrarDireccion(${direccion.id})">Eliminar</button>
          </div>
        `).join("")
      : '<p class="text-muted">No hay direcciones.</p>';

    const pedidos = await api("pedido.php");
    listaPedidos.innerHTML = pedidos.pedidos.length
      ? pedidos.pedidos.map((pedido) => `
          <div class="border rounded p-3 mb-3">
            <div class="d-flex justify-content-between">
              <strong>Pedido #${pedido.id}</strong>
              <span class="badge text-bg-secondary">${pedido.estado.replaceAll("_", " ")}</span>
            </div>
            <small>${new Date(pedido.fecha_creacion).toLocaleString("es-CO")}</small>
            <div class="mt-2">${pedido.items.map((item) => `${item.cantidad} × ${escC(item.nombre_producto)}`).join("<br>")}</div>
            <div class="text-end fw-bold">${money(pedido.total)}</div>
            ${pedido.numero_guia ? `<small>Guía: ${escC(pedido.numero_guia)}</small>` : ""}
          </div>
        `).join("")
      : '<p class="text-muted">Aún no tienes pedidos.</p>';
  } catch (error) {
    if (location.pathname.endsWith("cuenta.html")) {
      alert(error.message);
      location.href = "inicio_sesion.html";
    }
  }
}

perfilForm.onsubmit = async (event) => {
  event.preventDefault();

  try {
    await api("perfil.php", {
      method: "PUT",
      body: {
        nombre: perfilNombre.value,
        apellido: perfilApellido.value,
        telefono: perfilTelefono.value
      }
    });

    perfilMsg.innerHTML = '<span class="text-success">Guardado.</span>';
    aplicarEstadoSesion();
  } catch (error) {
    perfilMsg.innerHTML = `<span class="text-danger">${error.message}</span>`;
  }
};

dirTipo.onchange = () => {
  document.querySelectorAll(".campo-edificio").forEach((campo) => {
    campo.classList.toggle("d-none", !["apartamento", "edificio", "conjunto"].includes(dirTipo.value));
  });
};

dirTipo.dispatchEvent(new Event("change"));

direccionForm.onsubmit = async (event) => {
  event.preventDefault();

  try {
    await api("direcciones.php", {
      method: "POST",
      body: {
        etiqueta: dirEtiqueta.value,
        direccion_texto: dirTexto.value,
        barrio: dirBarrio.value,
        localidad: dirLocalidad.value,
        tipo_inmueble: dirTipo.value,
        detalle_inmueble: dirDetalle.value,
        torre: dirTorre.value,
        apartamento: dirApartamento.value,
        indicaciones: dirIndicaciones.value,
        latitud: dirLat.value || null,
        longitud: dirLng.value || null,
        predeterminada: dirPred.checked
      }
    });

    event.target.reset();
    dirTipo.dispatchEvent(new Event("change"));
    cargarCuenta();
  } catch (error) {
    alert(error.message);
  }
};

async function borrarDireccion(id) {
  if (confirm("¿Eliminar esta dirección?")) {
    await api(`direcciones.php?id=${id}`, { method: "DELETE" });
    cargarCuenta();
  }
}

function escC(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

document.addEventListener("DOMContentLoaded", cargarCuenta);

