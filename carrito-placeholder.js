// carrito-placeholder.js
// El ícono de carrito ya está en el nav (requisito de este sprint de UI),
// pero la lógica real de carrito llega en la fase de Backend.
// Por ahora solo muestra un aviso amigable en vez de no hacer nada.

document.addEventListener("DOMContentLoaded", function () {
    const botonCarrito = document.getElementById("botonCarrito");
    const toastEl = document.getElementById("toastCarrito");

    if (botonCarrito && toastEl && window.bootstrap) {
        const toast = new bootstrap.Toast(toastEl);
        botonCarrito.addEventListener("click", function (event) {
            event.preventDefault();
            toast.show();
        });
    }
});
