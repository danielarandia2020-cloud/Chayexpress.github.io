document.addEventListener("DOMContentLoaded", async () => {
  const sections = ["hamburguesas", "pizzas", "perros", "salchipapas", "postres", "bebidas", "combos"];
  const tabs = document.querySelector(".menu-tabs-wrapper");
  const main = document.querySelector("main");
  const tabsTop = tabs?.offsetTop || 0;

  const actualizarTabs = () => {
    const fijo = window.scrollY >= tabsTop - 65;
    tabs?.classList.toggle("menu-tabs-fixed", fijo);
    main?.classList.toggle("menu-tabs-fixed-space", fijo);
  };

  window.addEventListener("scroll", actualizarTabs, { passive: true });
  actualizarTabs();

  const termino = new URLSearchParams(window.location.search).get("buscar")?.trim().toLocaleLowerCase("es-CO") || "";
  const buscador = document.querySelector('input[name="buscar"]');

  if (buscador) buscador.value = termino;

  document.querySelectorAll(".card-producto[data-slug]").forEach((card) => {
    card.removeAttribute("role");
    card.removeAttribute("tabindex");
    card.removeAttribute("data-bs-toggle");
    card.removeAttribute("data-bs-target");

    const link = document.createElement("a");
    link.href = `producto.html?p=${encodeURIComponent(card.dataset.slug)}`;
    link.className = card.className;
    link.innerHTML = card.innerHTML;
    agregarBotonRapido(link, card.dataset);
    card.replaceWith(link);
  });

  try {
    const d = await api("productos.php");
    const by = {};
    sections.forEach((c) => (by[c] = []));

    d.productos
      .filter((p) => !termino || [p.nombre, p.descripcion, p.categoria].some((v) => String(v ?? "").toLocaleLowerCase("es-CO").includes(termino)))
      .forEach((p) => (by[p.categoria] ?? []).push(p));

    sections.forEach((cat) => {
      const sec = document.getElementById("cat-" + cat);
      if (!sec) return;

      let row = sec.querySelector(".row.g-4");
      if (!row) {
        row = document.createElement("div");
        row.className = "row g-4";
        sec.appendChild(row);
      }

      const productos = by[cat] || [];
      row.innerHTML = productos.length
        ? productos.map((p) => `
          <div class="col-6 col-md-4 col-lg-2dot4">
            <a class="card card-producto" href="producto.html?p=${encodeURIComponent(p.slug)}" data-producto-id="${p.id}" data-producto-nombre="${esc(p.nombre)}" data-producto-precio="${p.precio}" data-producto-imagen="${esc(p.imagen || "")}">
              <img src="${esc(p.imagen || "../img/isotipo.png")}" class="card-img-top" alt="${esc(p.nombre)}">
              <div class="card-body text-center">
                <h3 class="card-title h6">${esc(p.nombre)}</h3>
                <p class="small text-muted mb-2">${esc(p.descripcion)}</p>
                <span class="precio-tag d-block">${money(p.precio)}</span>
                <button type="button" class="boton-agregar-rapido" data-quick-add>+</button>
              </div>
            </a>
          </div>
        `).join("")
        : '<div class="col-12"><p class="text-muted">No hay productos que coincidan con la búsqueda.</p></div>';

      sec.hidden = Boolean(termino && !productos.length);

      sec.querySelectorAll("[data-quick-add]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();

          const card = button.closest(".card-producto");
          agregarProductoRapido({
            id: card.dataset.productoId,
            nombre: card.dataset.productoNombre,
            precio: Number(card.dataset.productoPrecio),
            imagen: card.dataset.productoImagen
          });
        });
      });
    });

    const encabezado = document.querySelector("header p");
    if (encabezado && termino) {
      encabezado.textContent = `Resultados para: "${termino}"`;
    }

    if (termino && !d.productos.some((p) => [p.nombre, p.descripcion, p.categoria].some((v) => String(v ?? "").toLocaleLowerCase("es-CO").includes(termino)))) {
      const contenido = document.querySelector("main");
      if (contenido) {
        contenido.insertAdjacentHTML("afterbegin", '<p class="alert alert-warning mt-4">No encontramos productos para esta búsqueda.</p>');
      }
    }
  } catch (error) {
    console.error(error);
  }
});

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function agregarBotonRapido(card, data) {
  const cuerpo = card.querySelector(".card-body");

  if (!cuerpo || cuerpo.querySelector("[data-quick-add]")) return;

  cuerpo.insertAdjacentHTML("beforeend", '<button type="button" class="boton-agregar-rapido" data-quick-add aria-label="Agregar producto al carrito">+</button>');

  cuerpo.querySelector("[data-quick-add]").addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!data.id) {
      window.location.href = `producto.html?p=${encodeURIComponent(data.slug)}`;
      return;
    }

    agregarProductoRapido({
      id: data.id,
      nombre: data.nombre,
      precio: Number(data.precio),
      imagen: data.imagen
    });
  });
}

