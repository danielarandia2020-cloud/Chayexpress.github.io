async function aplicarEstadoSesion() {
  try {
    const response = await api("auth/sesion.php");
    const hay = !!response.autenticado;

    document.querySelectorAll(".nav-solo-invitado").forEach((el) => {
      el.classList.toggle("d-none", hay);
    });

    document.querySelectorAll(".nav-solo-usuario").forEach((el) => {
      el.classList.toggle("d-none", !hay);
    });

    document.querySelectorAll("[data-usuario-nombre]").forEach((el) => {
      el.textContent = hay ? `${response.usuario.nombre} ${response.usuario.apellido}` : "";
    });

    window.chaySesion = response;
  } catch (error) {
    // Se ignora si el usuario no está autenticado.
  }
}

document.addEventListener("DOMContentLoaded", () => {
  aplicarEstadoSesion();

  const salir = document.getElementById("cerrarSesion");

  if (salir) {
    salir.addEventListener("click", async (event) => {
      event.preventDefault();
      await api("auth/logout.php", { method: "POST" });
      location.href = "index.html";
    });
  }
});

