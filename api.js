const CHAY_API = "../php/";

async function api(url, options = {}) {
  const opts = {
    ...options,
    headers: { ...(options.headers || {}) }
  };

  if (opts.body && !(opts.body instanceof FormData)) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(opts.body);
  }

  const response = await fetch(CHAY_API + url, opts);
  const data = await response.json().catch(() => ({
    ok: false,
    mensaje: "Respuesta inválida del servidor."
  }));

  if (!response.ok) {
    throw new Error(data.mensaje || "Error del servidor.");
  }

  return data;
}

function money(value) {
  return "$ " + Number(value || 0).toLocaleString("es-CO");
}

