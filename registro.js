document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formularioRegistro");
  const msg = document.getElementById("mensaje");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.getElementById("pass").value;

    if (password.length < 6) {
      msg.innerHTML = "<span class='error'>❌ La contraseña debe tener mínimo 6 caracteres.</span>";
      return;
    }

    try {
      await api("auth/registro.php", {
        method: "POST",
        body: {
          nombre: document.getElementById("nombre").value.trim(),
          apellido: document.getElementById("apellido").value.trim(),
          email: document.getElementById("correo").value.trim(),
          telefono: document.getElementById("telefono")?.value.trim() || "",
          password
        }
      });

      msg.innerHTML = "<span class='correcto'>🎉 Cuenta creada. Redirigiendo...</span>";
      setTimeout(() => location.href = "menu.html", 600);
    } catch (err) {
      msg.innerHTML = `<span class="error">❌ ${err.message}</span>`;
    }
  });
});

