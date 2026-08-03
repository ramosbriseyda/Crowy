const btn = document.getElementById("btn-analizar");
const loading = document.getElementById("loading");
const resultado = document.getElementById("resultado");
const errorBox = document.getElementById("error");
const resTipo = document.getElementById("res-tipo");
const labelVerdadera = document.getElementById("label-verdadera");
const resVerdadera = document.getElementById("res-verdadera");
const filaAmarillismo = document.getElementById("fila-amarillismo");
const resAmarillismo = document.getElementById("res-amarillismo");
const resJustificacionAmarillismo = document.getElementById(
  "res-justificacion-amarillismo"
);
const resResumen = document.getElementById("res-resumen");
const labelInforme = document.getElementById("label-informe");
const bloqueFalso = document.getElementById("bloque-falso");
const resKeypoints = document.getElementById("res-keypoints");
const tituloFuentes = document.getElementById("titulo-fuentes");
const resFuentes = document.getElementById("res-fuentes");

const BACKEND_URL = "http://127.0.0.1:8000/verificar";
let idAnalisisActivo = 0;

const VEREDICTO_LABEL = {
  falso: "Falso",
  enganoso: "Engañoso",
  parcialmente_cierto: "Parcialmente cierto",
  verdadero: "Verdadero",
  sin_verificar: "Sin verificar",
};

const VEREDICTO_COLOR = {
  falso: "#c62828",
  enganoso: "#ef6c00",
  parcialmente_cierto: "#f9a825",
  verdadero: "#2e7d32",
  sin_verificar: "#757575",
};

function mostrarError(mensaje) {
  errorBox.textContent = mensaje;
  errorBox.style.display = "block";
  resultado.style.display = "none";
}

function esUrlRestringida(url) {
  if (!url) return true;
  const bloqueadas = [
    "chrome://",
    "chrome-extension://",
    "edge://",
    "about:",
    "devtools://",
    "https://chrome.google.com/webstore",
    "https://chromewebstore.google.com",
  ];
  return bloqueadas.some((prefijo) => url.startsWith(prefijo));
}

function escapeHtml(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dominioDeUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_) {
    return url;
  }
}

function abrirEnNuevaPestana(url) {
  if (!url) return;
  chrome.tabs.create({ url });
}

function renderKeypoints(keypoints) {
  resKeypoints.innerHTML = "";
  if (!keypoints || !keypoints.length) {
    resKeypoints.innerHTML = '<li class="vacio">No se detectaron puntos clave.</li>';
    return;
  }

  for (const kp of keypoints) {
    const veredicto = kp.veredicto || "sin_verificar";
    const li = document.createElement("li");
    li.className = veredicto;
    li.innerHTML = `
      <div class="kp-veredicto" style="color:${VEREDICTO_COLOR[veredicto] || "#757575"}">
        ${escapeHtml(VEREDICTO_LABEL[veredicto] || veredicto)}
      </div>
      <div class="kp-afirmacion">${escapeHtml(kp.afirmacion)}</div>
      <div class="kp-explicacion">${escapeHtml(kp.explicacion)}</div>
    `;
    resKeypoints.appendChild(li);
  }
}

function renderFuentes(fuentes) {
  resFuentes.innerHTML = "";
  if (!fuentes || !fuentes.length) {
    resFuentes.innerHTML =
      '<li class="vacio">No se encontraron fuentes citables para este análisis.</li>';
    return;
  }

  for (const fuente of fuentes) {
    const li = document.createElement("li");
    const titulo = fuente.titulo || dominioDeUrl(fuente.url) || "Fuente";
    const link = document.createElement("a");
    link.textContent = titulo;
    link.role = "button";
    link.tabIndex = 0;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      abrirEnNuevaPestana(fuente.url);
    });
    link.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        abrirEnNuevaPestana(fuente.url);
      }
    });

    const dominio = document.createElement("div");
    dominio.className = "fuente-dominio";
    dominio.textContent = dominioDeUrl(fuente.url);

    const fragmento = document.createElement("div");
    fragmento.className = "fuente-fragmento";
    fragmento.textContent = fuente.fragmento || "";

    li.appendChild(link);
    li.appendChild(dominio);
    if (fuente.fragmento) li.appendChild(fragmento);
    resFuentes.appendChild(li);
  }
}

async function extraerDatosDePestana(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["lib/Readability.js", "content.js"],
  });

  const resultados = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      if (typeof globalThis.__verificadorExtraerDatos === "function") {
        return globalThis.__verificadorExtraerDatos();
      }
      return null;
    },
  });

  return resultados?.[0]?.result || null;
}

btn.addEventListener("click", async () => {
  const idAnalisis = ++idAnalisisActivo;
  btn.disabled = true;
  loading.style.display = "block";
  resultado.style.display = "none";
  errorBox.style.display = "none";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error("No se pudo detectar una pestaña activa.");
    }

    if (esUrlRestringida(tab.url)) {
      throw new Error(
        "No se puede analizar esta página. Abre una noticia en un sitio web normal (no chrome:// ni la Chrome Web Store)."
      );
    }

    loading.textContent = "Extrayendo texto de la noticia...";
    const datosArticulo = await extraerDatosDePestana(tab.id);
    if (idAnalisis !== idAnalisisActivo) return;
    const contenido = datosArticulo?.content || "";

    if (contenido.trim().length < 80) {
      throw new Error(
        "No se pudo extraer texto legible de este sitio. Prueba con el artículo completo abierto."
      );
    }

    loading.textContent = "Buscando fuentes y verificando...";
    const backendResponse = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: datosArticulo?.url || tab.url || "",
        domain: datosArticulo?.domain || dominioDeUrl(tab.url || ""),
        title: datosArticulo?.title || tab.title || "",
        content: contenido,
        texto: contenido,
        links: datosArticulo?.links || [],
      }),
    });
    if (idAnalisis !== idAnalisisActivo) return;

    if (!backendResponse.ok) {
      let detalle = `Error en el servidor (${backendResponse.status})`;
      try {
        const err = await backendResponse.json();
        if (err.detail) {
          detalle = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
        }
      } catch (_) {
        /* ignore */
      }
      throw new Error(detalle);
    }

    const data = await backendResponse.json();
    const etiquetasTipo = {
      noticia: "Noticia",
      reportaje: "Reportaje",
      opinion: "Opinión",
      no_noticia: "No es noticia (spam/fake/otro)",
    };
    const esPeriodistico = data.tipo_contenido !== "no_noticia";

    resTipo.textContent = etiquetasTipo[data.tipo_contenido] || "Contenido no clasificado";
    resTipo.style.color = esPeriodistico ? "#1565c0" : "#6a1b9a";

    labelVerdadera.textContent = esPeriodistico
      ? "¿Es confiable?:"
      : "¿Es legítimo (no spam/fake)?:";
    resVerdadera.textContent = data.es_verdadera ? "Sí" : "No";
    resVerdadera.style.color = data.es_verdadera ? "#2e7d32" : "#c62828";

    if (esPeriodistico && data.nivel_amarillismo) {
      filaAmarillismo.style.display = "block";
      resAmarillismo.textContent = data.nivel_amarillismo;
      resJustificacionAmarillismo.textContent =
        data.justificacion_amarillismo || "Sin justificación disponible.";
      if (data.nivel_amarillismo === "Alto") {
        resAmarillismo.style.color = "#c62828";
      } else if (data.nivel_amarillismo === "Medio") {
        resAmarillismo.style.color = "#ef6c00";
      } else {
        resAmarillismo.style.color = "#2e7d32";
      }
    } else {
      filaAmarillismo.style.display = "none";
      resAmarillismo.textContent = "-";
      resJustificacionAmarillismo.textContent = "-";
    }

    resResumen.textContent =
      data.informe_correcciones || data.resumen || "Sin informe disponible.";

    renderFuentes(data.fuentes);

    // Los puntos clave solo se muestran cuando es falsa / no confiable.
    if (!data.es_verdadera) {
      labelInforme.textContent = "Resumen:";
      bloqueFalso.style.display = "block";
      tituloFuentes.textContent = "Fuentes que desmienten o corrigen";
      renderKeypoints(data.keypoints);
    } else {
      labelInforme.textContent = "Informe / Correcciones:";
      bloqueFalso.style.display = "none";
      tituloFuentes.textContent = "Fuentes que respaldan la noticia";
      resKeypoints.innerHTML = "";
    }

    resultado.style.display = "block";
  } catch (error) {
    if (idAnalisis !== idAnalisisActivo) return;
    const mensaje = error?.message || String(error);
    if (/Failed to fetch|NetworkError|fetch/i.test(mensaje)) {
      mostrarError(
        "No se pudo conectar con el backend. Asegúrate de que esté corriendo en http://127.0.0.1:8000"
      );
    } else if (/Cannot access|Cannot find|Receiving end does not exist/i.test(mensaje)) {
      mostrarError(
        "Chrome no permite inyectar scripts en esta página. Abre una noticia en un sitio web normal."
      );
    } else {
      mostrarError(mensaje);
    }
  } finally {
    if (idAnalisis === idAnalisisActivo) {
      btn.disabled = false;
      loading.style.display = "none";
      loading.textContent = "Extrayendo texto y consultando al servidor...";
    }
  }
});

chrome.tabs.onActivated.addListener(() => {
  idAnalisisActivo += 1;
  btn.disabled = false;
  loading.style.display = "none";
  resultado.style.display = "none";
  errorBox.style.display = "none";
});
