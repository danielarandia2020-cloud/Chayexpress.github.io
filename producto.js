document.addEventListener("DOMContentLoaded", async () => {
  const botonAtras = document.getElementById("botonAtras");

  botonAtras?.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "menu.html";
    }
  });

  const slug = new URLSearchParams(location.search).get("p");
  const form = document.getElementById("formPersonalizacion");

  if (!form) return;

  try {
    const d = await api("productos.php");
    const producto = d.productos.find((item) => item.slug === slug) || d.productos[0];

    if (!producto) return;

    document.getElementById("nombreProducto").textContent = producto.nombre;
    document.getElementById("descripcionProducto").textContent = producto.descripcion;
    document.getElementById("ingredientesProducto").textContent = detalles[producto.slug] || "Ingredientes frescos preparados al momento.";
    document.getElementById("precioProducto").textContent = money(producto.precio);
    document.getElementById("imagenProducto").src = producto.imagen;
    document.getElementById("imagenProducto").alt = producto.nombre;
    document.title = `${producto.nombre} — CHAY Express`;

    renderizarPersonalizacion(producto.categoria, producto.slug);

    const actualizarTotal = () => actualizarPrecioTotal(producto.precio, form);
    form.addEventListener("input", actualizarTotal);
    form.addEventListener("change", actualizarTotal);
    actualizarTotal();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const cantidad = Math.max(1, Math.min(5, Number(document.getElementById("cantidadProducto").value) || 1));
      document.getElementById("cantidadProducto").value = cantidad;

      const personalizacion = {};
      form.querySelectorAll("input[type=radio]:checked").forEach((input) => {
        personalizacion[input.name] = input.value;
      });

      personalizacion.salsas = [...form.querySelectorAll("input[name='salsas[]']:checked")].map((input) => input.value);
      personalizacion.extras = [...form.querySelectorAll("input[data-extra]:checked")].map((input) => ({
        nombre: input.dataset.extra,
        cantidad: 1
      }));

      try {
        await api("carrito.php", {
          method: "POST",
          body: {
            producto_id: producto.id,
            cantidad,
            personalizacion
          }
        });

        window.actualizarCarrito?.();
        mostrarModalProductoAgregado(producto, cantidad, personalizacion);
        mostrarConfirmacionAgregar(producto.precio, form);
      } catch (error) {
        document.getElementById("mensajeProducto").innerHTML = `<span class="error">❌ ${error.message}</span>`;
      }
    });
  } catch (error) {
    document.getElementById("mensajeProducto").textContent = error.message;
  }
});

function mostrarConfirmacionAgregar(precioBase, form) {
  const boton = document.getElementById("botonAgregarProducto");

  if (!boton) return;

  boton.classList.remove("producto-agregado");
  void boton.offsetWidth;
  boton.classList.add("producto-agregado");
  boton.innerHTML = "&#10003; Agregado al carrito";

  setTimeout(() => {
    boton.classList.remove("producto-agregado");
    form.reset();
    boton.innerHTML = `Agregar al carrito · <span id="precioTotalProducto">$ 0</span>`;
    actualizarPrecioTotal(precioBase, form);
  }, 2000);
}

function mostrarModalProductoAgregado(producto, cantidad, personalizacion) {
  let modal = document.getElementById("modalProductoAgregado");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modalProductoAgregado";
    modal.className = "modal fade";
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5">Producto agregado</h2>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">
            <div class="d-flex gap-3 align-items-center">
              <img id="productoAgregadoImagen" class="rounded" style="width:92px;height:92px;object-fit:cover" alt="">
              <div>
                <h3 id="productoAgregadoNombre" class="h6 mb-1"></h3>
                <p id="productoAgregadoCantidad" class="mb-1"></p>
                <p id="productoAgregadoOpciones" class="small text-muted mb-0"></p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Seguir comprando</button>
            <button type="button" class="btn btn-cta" id="irAlCarrito">Ir al carrito</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector("#irAlCarrito").addEventListener("click", () => {
      bootstrap.Modal.getInstance(modal)?.hide();
      window.abrirCarrito?.();
    });
  }

  modal.querySelector("#productoAgregadoImagen").src = producto.imagen || "../img/isotipo.png";
  modal.querySelector("#productoAgregadoImagen").alt = producto.nombre;
  modal.querySelector("#productoAgregadoNombre").textContent = producto.nombre;
  modal.querySelector("#productoAgregadoCantidad").textContent = `Cantidad: ${cantidad}`;

  const opciones = [];
  Object.entries(personalizacion).forEach(([nombre, valor]) => {
    if (Array.isArray(valor) && valor.length) {
      opciones.push(`${nombre}: ${valor.join(", ")}`);
    } else if (valor) {
      opciones.push(`${nombre}: ${valor}`);
    }
  });

  modal.querySelector("#productoAgregadoOpciones").textContent = opciones.length
    ? opciones.join(" · ")
    : "Sin personalización adicional";

  bootstrap.Modal.getOrCreateInstance(modal).show();
}

const detalles = {
  "hamburguesa-clasica-con-queso": "Carne de res, queso fundido, lechuga fresca, tomate, cebolla y salsa especial en pan de hamburguesa.",
  "hamburguesa-doble-carne": "Doble carne de res, doble queso, lechuga, tomate, cebolla y salsa de la casa en pan artesanal.",
  "hamburguesa-bbq-tocineta": "Doble carne, queso, tocineta crocante, cebolla crispy, lechuga y salsa BBQ.",
  "hamburguesa-gourmet-chay": "Carne premium, queso cheddar, cebolla caramelizada, lechuga y salsa especial en pan artesanal.",
  "hamburguesa-vegetariana": "Medallon vegetal, queso, lechuga, tomate, cebolla y salsa especial.",
  "pizza-personal-de-pepperoni": "Masa artesanal, salsa de tomate, mozzarella y pepperoni horneado.",
  "pizza-personal-hawaiana": "Masa artesanal, salsa de tomate, mozzarella, jamon y piña.",
  "pizza-personal-de-pollo": "Masa artesanal, salsa de tomate, mozzarella, pollo desmechado y maiz.",
  "pizza-personal-vegetariana": "Masa artesanal, salsa de tomate, mozzarella, champiñones, pimenton y vegetales frescos.",
  "pizza-personal-cuatro-quesos": "Masa artesanal, salsa de tomate y mezcla de mozzarella, cheddar, parmesano y gorgonzola.",
  "perro-caliente-especial": "Salchicha, queso derretido, papas crocantes y salsas de la casa.",
  "perro-caliente-clasico": "Salchicha, papas de paquete, mayonesa, tomate y mostaza.",
  "perro-caliente-ranchero": "Salchicha ranchera, tocineta, queso, cebolla crispy y salsas.",
  "perro-caliente-doble-salchicha": "Dos salchichas, queso derretido y salsa especial.",
  "perro-caliente-mexicano": "Salchicha, guacamole, jalapeños y salsa picante.",
  "salchipapa-tradicional": "Papas crocantes, salchicha y salsas de tomate y rosada.",
  "papas-fritas-locas": "Papas crocantes con tocineta, queso fundido y salsa BBQ.",
  "salchipapa-ranchera": "Papas, salchicha ranchera, tocineta, queso y salsas.",
  "salchipapa-mixta": "Papas, salchicha, trozos de pollo y salsa de la casa.",
  "papas-fritas-simples": "Papas fritas crocantes sazonadas con sal fina.",
  "postre-tres-leches": "Bizcocho suave bañado en tres leches y terminado con crema.",
  "brownie-con-helado": "Brownie de chocolate tibio acompañado con helado de vainilla y salsa.",
  "torta-de-chocolate": "Porcion de torta humeda de chocolate con cubierta cremosa.",
  "copa-de-helado": "Tres bolas de helado con salsa y toppings a elección.",
  "waffle-con-frutas": "Waffle crocante con frutas frescas y miel.",
  "jugo-natural-de-lulo": "Jugo natural de lulo preparado al momento, en agua o leche.",
  "jugo-natural-de-maracuya": "Jugo natural de maracuya preparado al momento, en agua o leche.",
  "jugo-natural-de-mora": "Jugo natural de mora preparado al momento, en agua o leche.",
  "gaseosa-personal": "Gaseosa personal de 350 ml en el sabor disponible que elijas.",
  "limonada-de-coco": "Limonada natural con coco, hielo y mezcla cremosa.",
  "combo-el-personal": "Hamburguesa clasica, papas crocantes y bebida personal.",
  "combo-el-parrandero": "Dos hamburguesas, dos bebidas y papas grandes para compartir.",
  "combo-la-cita": "Dos hamburguesas gourmet, papas y dos bebidas.",
  "combo-de-salchichas-familiar": "Salchipapa familiar con cuatro bebidas y salsas.",
  "combo-duo-hamburguesas": "Dos hamburguesas clasicas con papas y bebida."
};

function renderizarPersonalizacionIndividual(slug) {
  const contenedor = document.getElementById("opcionesPersonalizacion");
  if (!contenedor) return;

  const bloque = (titulo, tipo, campo, items) => [titulo, tipo, campo, items];
  const opciones = {
    "hamburguesa-clasica-con-queso": [
      bloque("Ingredientes", "checkbox", "ingredientes[]", [["cebolla", "Cebolla"], ["tomate", "Tomate"], ["lechuga", "Lechuga"]]),
      bloque("Extras", "checkbox", "adiciones[]", [["queso", "Extra queso (+$3.000)"], ["tocineta", "Tocineta (+$4.000)"]])
    ],
    "hamburguesa-doble-carne": [
      bloque("Quesos", "checkbox", "adiciones[]", [["cheddar", "Doble cheddar"], ["mozzarella", "Mozzarella"]]),
      bloque("Salsas", "radio", "salsa", [["especial", "Especial"], ["bbq", "BBQ"]])
    ],
    "hamburguesa-bbq-tocineta": [
      bloque("Extras", "checkbox", "adiciones[]", [["queso", "Extra queso"], ["cebolla-crispy", "Cebolla crispy"], ["jalapeno", "Jalapeño"]])
    ],
    "hamburguesa-gourmet-chay": [
      bloque("Punto de la carne", "radio", "coccion", [["termino-medio", "Término medio"], ["tres-cuartos", "Tres cuartos"], ["bien-cocida", "Bien cocida"]]),
      bloque("Extras", "checkbox", "adiciones[]", [["cheddar", "Extra cheddar"], ["cebolla-caramelizada", "Cebolla caramelizada"]])
    ],
    "hamburguesa-vegetariana": [
      bloque("Extras vegetales", "checkbox", "adiciones[]", [["aguacate", "Aguacate"], ["champiñones", "Champiñones"], ["queso", "Extra queso"]])
    ],
    "pizza-personal-de-pepperoni": [
      bloque("Tamaño", "radio", "tamano", [["personal", "Personal"], ["mediana", "Mediana (+$5.000)"]]),
      bloque("Extras", "checkbox", "adiciones[]", [["extra-queso", "Extra queso"], ["extra-pepperoni", "Extra pepperoni"]])
    ],
    "pizza-personal-hawaiana": [
      bloque("Tamaño", "radio", "tamano", [["personal", "Personal"], ["mediana", "Mediana (+$5.000)"]]),
      bloque("Extras", "checkbox", "adiciones[]", [["extra-jamon", "Extra jamón"], ["extra-piña", "Extra piña"]])
    ],
    "pizza-personal-de-pollo": [
      bloque("Tamaño", "radio", "tamano", [["personal", "Personal"], ["mediana", "Mediana (+$5.000)"]]),
      bloque("Extras", "checkbox", "adiciones[]", [["maiz", "Maíz"], ["extra-pollo", "Extra pollo"]])
    ],
    "pizza-personal-vegetariana": [
      bloque("Ingredientes", "checkbox", "adiciones[]", [["champiñones", "Champiñones"], ["pimenton", "Pimentón"], ["extra-queso", "Extra queso"]])
    ],
    "pizza-personal-cuatro-quesos": [
      bloque("Tamaño", "radio", "tamano", [["personal", "Personal"], ["mediana", "Mediana (+$5.000)"]]),
      bloque("Extra queso", "checkbox", "adiciones[]", [["gorgonzola", "Gorgonzola"], ["mozzarella", "Mozzarella"]])
    ],
    "perro-caliente-especial": [
      bloque("Extras", "checkbox", "adiciones[]", [["queso", "Extra queso"], ["papas", "Más papas"], ["tocineta", "Tocineta"]])
    ],
    "perro-caliente-clasico": [
      bloque("Salsas", "checkbox", "salsas[]", [["mayonesa", "Mayonesa"], ["tomate", "Salsa de tomate"], ["mostaza", "Mostaza"]])
    ],
    "perro-caliente-ranchero": [
      bloque("Extras", "checkbox", "adiciones[]", [["tocineta", "Tocineta"], ["queso", "Extra queso"], ["cebolla-crispy", "Cebolla crispy"]])
    ],
    "perro-caliente-doble-salchicha": [
      bloque("Salsas", "radio", "salsa", [["especial", "Especial"], ["bbq", "BBQ"], ["ajo", "Ajo"]]),
      bloque("Extra", "checkbox", "adiciones[]", [["queso", "Extra queso"]])
    ],
    "perro-caliente-mexicano": [
      bloque("Nivel de picante", "radio", "picante", [["suave", "Suave"], ["medio", "Medio"], ["alto", "Alto"]]),
      bloque("Extras", "checkbox", "adiciones[]", [["guacamole", "Guacamole"], ["jalapeno", "Jalapeño"]])
    ],
    "salchipapa-tradicional": [
      bloque("Tamaño", "radio", "tamano", [["personal", "Personal"], ["familiar", "Familiar (+$8.000)"]]),
      bloque("Salsas", "checkbox", "salsas[]", [["tomate", "Tomate"], ["rosada", "Rosada"]])
    ],
    "papas-fritas-locas": [
      bloque("Extras", "checkbox", "adiciones[]", [["queso", "Queso fundido"], ["tocineta", "Tocineta"], ["bbq", "BBQ"]])
    ],
    "salchipapa-ranchera": [
      bloque("Tamaño", "radio", "tamano", [["personal", "Personal"], ["familiar", "Familiar (+$8.000)"]]),
      bloque("Extras", "checkbox", "adiciones[]", [["queso", "Extra queso"], ["chorizo", "Chorizo"]])
    ],
    "salchipapa-mixta": [
      bloque("Proteína adicional", "checkbox", "adiciones[]", [["pollo", "Extra pollo"], ["salchicha", "Extra salchicha"]]),
      bloque("Salsa", "radio", "salsa", [["rosada", "Rosada"], ["ajo", "Ajo"]])
    ],
    "papas-fritas-simples": [
      bloque("Sabor", "radio", "sabor", [["natural", "Sal fina"], ["paprika", "Paprika"]]),
      bloque("Salsa", "radio", "salsa", [["sin-salsa", "Sin salsa"], ["tomate", "Tomate"]])
    ],
    "postre-tres-leches": [
      bloque("Topping", "radio", "topping", [["sin-topping", "Sin topping"], ["frutas", "Frutas"], ["chocolate", "Chocolate"]])
    ],
    "brownie-con-helado": [
      bloque("Helado", "radio", "helado", [["vainilla", "Vainilla"], ["chocolate", "Chocolate"], ["fresa", "Fresa"]]),
      bloque("Topping", "checkbox", "toppings[]", [["chocolate", "Chocolate"], ["arequipe", "Arequipe"]])
    ],
    "torta-de-chocolate": [
      bloque("Topping", "radio", "topping", [["sin-topping", "Sin topping"], ["arequipe", "Arequipe"], ["chocolate", "Chocolate"]])
    ],
    "copa-de-helado": [
      bloque("Sabores", "checkbox", "sabores[]", [["vainilla", "Vainilla"], ["chocolate", "Chocolate"], ["fresa", "Fresa"]]),
      bloque("Salsa", "radio", "salsa", [["chocolate", "Chocolate"], ["arequipe", "Arequipe"]])
    ],
    "waffle-con-frutas": [
      bloque("Fruta", "checkbox", "frutas[]", [["fresa", "Fresa"], ["banano", "Banano"], ["manzana", "Manzana"]]),
      bloque("Salsa", "radio", "salsa", [["miel", "Miel"], ["chocolate", "Chocolate"]])
    ],
    "jugo-natural-de-lulo": [
      bloque("Preparación", "radio", "preparacion", [["agua", "En agua"], ["leche", "En leche (+$1.000)"]]),
      bloque("Endulzante", "radio", "endulzante", [["normal", "Azúcar normal"], ["sin-azucar", "Sin azúcar"]])
    ],
    "jugo-natural-de-maracuya": [
      bloque("Preparación", "radio", "preparacion", [["agua", "En agua"], ["leche", "En leche (+$1.000)"]]),
      bloque("Pulpa", "radio", "pulpa", [["normal", "Pulpa normal"], ["extra", "Extra pulpa (+$2.000)"]])
    ],
    "jugo-natural-de-mora": [
      bloque("Preparación", "radio", "preparacion", [["agua", "En agua"], ["leche", "En leche (+$1.000)"]]),
      bloque("Endulzante", "radio", "endulzante", [["normal", "Azúcar normal"], ["sin-azucar", "Sin azúcar"], ["miel", "Miel"]])
    ],
    "gaseosa-personal": [
      bloque("Sabor", "radio", "sabor", [["cola", "Cola"], ["manzana", "Manzana"], ["uva", "Uva"]])
    ],
    "limonada-de-coco": [
      bloque("Tamaño", "radio", "tamano", [["personal", "Personal"], ["grande", "Grande (+$2.000)"]]),
      bloque("Hielo", "radio", "hielo", [["normal", "Con hielo"], ["sin-hielo", "Sin hielo"]])
    ],
    "combo-el-personal": [
      bloque("Bebida", "radio", "bebida", [["gaseosa", "Gaseosa"], ["jugo", "Jugo natural"]]),
      bloque("Extra", "checkbox", "adiciones[]", [["queso", "Extra queso"]])
    ],
    "combo-el-parrandero": [
      bloque("Bebidas", "checkbox", "bebidas[]", [["gaseosa", "Gaseosas"], ["jugo", "Jugos naturales"]]),
      bloque("Salsa", "radio", "salsa", [["tomate", "Tomate"], ["bbq", "BBQ"]])
    ],
    "combo-la-cita": [
      bloque("Bebida", "radio", "bebida", [["gaseosa", "Gaseosa"], ["limonada", "Limonada"]]),
      bloque("Extras", "checkbox", "adiciones[]", [["queso", "Extra queso"], ["tocineta", "Tocineta"]])
    ],
    "combo-de-salchichas-familiar": [
      bloque("Bebidas", "checkbox", "bebidas[]", [["gaseosa", "Gaseosas"], ["jugo", "Jugos naturales"], ["limonada", "Limonadas"]]),
      bloque("Salsas", "checkbox", "salsas[]", [["tomate", "Tomate"], ["rosada", "Rosada"]])
    ],
    "combo-duo-hamburguesas": [
      bloque("Bebida", "radio", "bebida", [["gaseosa", "Gaseosa"], ["jugo", "Jugo natural"]]),
      bloque("Extras", "checkbox", "adiciones[]", [["queso", "Extra queso"], ["tocineta", "Tocineta"]])
    ]
  }[slug] || [];

  contenedor.innerHTML = opciones.map(([titulo, tipo, nombreCampo, items]) => {
    return `<div class="mb-3"><p class="fw-bold mb-1">${titulo}:</p>${items.map(([valor, etiqueta], indice) => `
      <label class="opcion-personalizacion form-check form-check-inline">
        <input class="form-check-input" type="${tipo}" name="${nombreCampo}" value="${valor}" ${tipo === "radio" && indice === 0 ? "checked" : ""}>
        <span class="form-check-label">${etiqueta}</span>
      </label>
    `).join("")}</div>`;
  }).join("");
}

function renderizarPersonalizacion(categoria, slug) {
  const contenedor = document.getElementById("opcionesPersonalizacion");
  if (categoria === "postres" || categoria === "bebidas") {
    renderizarPersonalizacionIndividual(slug);
    return;
  }

  const bloque = (titulo, contenido) => `<div class="mb-3"><p class="fw-bold mb-1">${titulo}:</p>${contenido}</div>`;
  const radios = (name, items) => items.map((item, index) => `
    <label class="opcion-personalizacion form-check form-check-inline">
      <input class="form-check-input" type="radio" name="${name}" value="${item[0]}" ${index === 0 ? "checked" : ""}>
      <span class="form-check-label">${item[1]}</span>
    </label>
  `).join("");

  const extras = (items) => bloque(
    "Extras",
    items.map((item) => {
      const precio = precioExtra(item[0]);
      const etiqueta = item[1].includes("(+$") ? item[1] : `${item[1]} (+${money(precio).replace("$ ", "$")})`;

      return `
        <label class="opcion-personalizacion form-check d-flex align-items-center gap-2 mb-2">
          <input class="form-check-input" type="checkbox" data-extra="${item[0]}" data-extra-price="${precio}" aria-label="${etiqueta}">
          <span class="form-check-label">${etiqueta}</span>
        </label>
      `;
    }).join("")
  );

  const salsas = bloque(
    "Salsas",
    [["tomate", "Tomate"], ["rosada", "Rosada"], ["mayonesa", "Mayonesa"], ["bbq", "BBQ"], ["ajo", "Ajo"]].map((item) => `
      <label class="opcion-personalizacion form-check form-check-inline">
        <input class="form-check-input" type="checkbox" name="salsas[]" value="${item[0]}">
        <span class="form-check-label">${item[1]}</span>
      </label>
    `).join("")
  );

  const opciones = {
    hamburguesas: extras([["queso", "Extra queso (+$3.000)"], ["carne", "Extra carne (+$6.000)"], ["tocineta", "Tocineta (+$4.000)"]]) + salsas,
    pizzas: bloque("Tamaño", radios("tamano", [["personal", "Personal"], ["mediana", "Mediana"], ["familiar", "Familiar"]])) + extras([["queso", "Extra queso"], ["jamon", "Extra jamón"], ["pepperoni", "Extra pepperoni"]]),
    perros: extras([["queso", "Extra queso"], ["tocineta", "Tocineta"], ["cebolla-crispy", "Cebolla crispy"]]) + salsas,
    salchipapas: bloque("Tamaño", radios("tamano", [["personal", "Personal"], ["mediana", "Mediana"], ["familiar", "Familiar"]])) + extras([["queso", "Extra queso"], ["tocineta", "Tocineta"], ["pollo", "Extra pollo"]]) + salsas,
    combos: extras([["queso", "Extra queso"], ["tocineta", "Tocineta"], ["carne", "Extra carne"]]) + salsas,
    postres: bloque("Acompañamiento", radios("acompanamiento", [["sin-extra", "Sin extra"], ["helado", "Helado"], ["frutas", "Frutas"]])),
    bebidas: bloque("Presentación", radios("presentacion", [["fria", "Fría"], ["sin-hielo", "Sin hielo"]]))
  };

  contenedor.innerHTML = opciones[categoria] || "";
}

function precioExtra(extra) {
  return { queso: 3000, carne: 6000, tocineta: 4000, pollo: 6000, jamon: 4000, pepperoni: 5000 }[extra] || 3000;
}

function actualizarPrecioTotal(precioBase, form) {
  const cantidad = Math.max(1, Math.min(5, Number(document.getElementById("cantidadProducto")?.value) || 1));
  const campoCantidad = document.getElementById("cantidadProducto");

  if (campoCantidad) campoCantidad.value = cantidad;

  const tamano = form.querySelector("input[name='tamano']:checked")?.value;
  const recargoTamano = { mediana: 5000, familiar: 10000, grande: 10000 }[tamano] || 0;
  const extras = [...form.querySelectorAll("input[data-extra]:checked")].reduce((total, input) => total + Number(input.dataset.extraPrice || 0), 0);
  const total = (Number(precioBase) + recargoTamano + extras) * cantidad;
  const salida = document.getElementById("precioTotalProducto");

  if (salida) salida.textContent = money(total);
}

