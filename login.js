document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formularioLogin");
  const msg = document.getElementById("mensaje");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    msg.textContent = "Ingresando...";

    try {
      await api("auth/login.php", {
        method: "POST",
        body: {
          email: document.getElementById("usuario").value.trim(),
          password: document.getElementById("contrasena").value
        }
      });

      msg.innerHTML = "<span class='correcto'>✅ Bienvenido/a. Redirigiendo...</span>";
      setTimeout(() => location.href = "menu.html", 500);
    } catch (err) {
      msg.innerHTML = `<span class="error">❌ ${err.message}</span>`;
    }
  });
});

