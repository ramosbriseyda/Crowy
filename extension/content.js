function limpiarDominio(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^(www\.|m\.)/, "");
  } catch (_) {
    return "";
  }
}

function extraerEnlaces(contenedor) {
  if (!contenedor) return [];

  const enlaces = [];
  const vistos = new Set();
  for (const enlace of contenedor.querySelectorAll("a[href]")) {
    try {
      const url = new URL(enlace.getAttribute("href"), window.location.href);
      if (!["http:", "https:"].includes(url.protocol)) continue;

      const urlLimpia = url.href.split("#")[0];
      if (vistos.has(urlLimpia)) continue;
      vistos.add(urlLimpia);

      enlaces.push({
        texto: (enlace.textContent || "").trim().replace(/\s+/g, " ").substring(0, 180),
        url: urlLimpia,
      });
      if (enlaces.length >= 30) break;
    } catch (_) {
      /* Ignore invalid links. */
    }
  }
  return enlaces;
}

function obtenerTitulo() {
  return (
    document.querySelector('meta[property="og:title"]')?.content ||
    document.querySelector('meta[name="twitter:title"]')?.content ||
    document.querySelector("h1")?.textContent ||
    document.title ||
    ""
  )
    .trim()
    .replace(/\s+/g, " ")
    .substring(0, 500);
}

/**
 * Extract metadata and main text with Mozilla Readability.
 * Sends cleaned text, not the full HTML.
 */
function extraerDatosArticulo() {
  const datosBase = {
    url: window.location.href,
    domain: limpiarDominio(window.location.href),
    title: obtenerTitulo(),
    content: "",
    links: [],
  };

  try {
    if (typeof Readability === "function") {
      const documento = document.cloneNode(true);
      const articulo = new Readability(documento).parse();

      if (articulo && articulo.textContent) {
        const contenido = articulo.textContent.trim().replace(/\n{3,}/g, "\n\n");
        if (contenido.length >= 100) {
          const contenedorTemporal = document.createElement("div");
          contenedorTemporal.innerHTML = articulo.content || "";
          return {
            ...datosBase,
            title: (articulo.title || datosBase.title).trim().substring(0, 500),
            content: contenido.substring(0, 12000),
            links: extraerEnlaces(contenedorTemporal),
          };
        }
      }
    }
  } catch (error) {
    console.warn("[Crowy] Readability failed, using fallback:", error);
  }

  return extraerDatosFallback(datosBase);
}

function extraerDatosFallback(datosBase) {
  const contenedor =
    document.querySelector("article") ||
    document.querySelector('[role="main"]') ||
    document.querySelector("main") ||
    document.body;

  if (!contenedor) {
    return datosBase;
  }

  const parrafos = Array.from(contenedor.querySelectorAll("p, h1, h2, h3"))
    .map((el) => (el.innerText || "").trim())
    .filter((texto) => texto.length > 25);

  const textoFiltrado = parrafos.join("\n\n");

  const contenido =
    textoFiltrado.length >= 150
      ? textoFiltrado.substring(0, 12000)
      : (document.body?.innerText || "").substring(0, 8000).trim();

  return {
    ...datosBase,
    content: contenido,
    links: extraerEnlaces(contenedor),
  };
}

// Exposed for popup.js without depending on chrome.tabs.sendMessage.
globalThis.__verificadorExtraerDatos = extraerDatosArticulo;
globalThis.__verificadorExtraerTexto = () => extraerDatosArticulo().content;

if (!globalThis.__verificadorListenerRegistrado) {
  globalThis.__verificadorListenerRegistrado = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "extraerTexto") {
      try {
        sendResponse(extraerDatosArticulo());
      } catch (error) {
        sendResponse({
          url: window.location.href,
          domain: limpiarDominio(window.location.href),
          title: obtenerTitulo(),
          content: "",
          links: [],
          error: error.message,
        });
      }
    }
    return true;
  });
}
