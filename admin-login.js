document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formAdminLogin");
  const msg = document.getElementById("adminMsg");

  if (!form) return;

  form.onsubmit = async (event) => {
    event.preventDefault();

    try {
      await api("admin/login_admin.php", {
        method: "POST",
        body: {
          email: adminEmail.value.trim(),
          password: adminPass.value
        }
      });

      location.href = "admin.html";
    } catch (err) {
      msg.innerHTML = `<span class="error">❌ ${err.message}</span>`;
    }
  };
});

