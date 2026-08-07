const btn = document.getElementById("btn-analizar");
const bienvenida = document.getElementById("bienvenida");
const privacy = document.getElementById("privacy");
const loading = document.getElementById("loading");
const loadingText = document.getElementById("loading-text");
const resultado = document.getElementById("resultado");
const errorBox = document.getElementById("error");

const ANALYZE_STATUS_STEPS = [
  "Extracting the article...",
  "Cleaning the main content...",
  "Searching reliable sources...",
  "Cross-checking claims...",
  "Analyzing sensationalism...",
  "Building your report...",
];

let statusTimer = null;

function setLoadingMessage(message) {
  if (loadingText) {
    loadingText.textContent = message;
  }
}

function stopStatusRotation() {
  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }
}

function startStatusRotation(startIndex = 0) {
  stopStatusRotation();
  let index = startIndex;
  setLoadingMessage(ANALYZE_STATUS_STEPS[index]);
  statusTimer = setInterval(() => {
    index = Math.min(index + 1, ANALYZE_STATUS_STEPS.length - 1);
    setLoadingMessage(ANALYZE_STATUS_STEPS[index]);
    if (index >= ANALYZE_STATUS_STEPS.length - 1) {
      stopStatusRotation();
    }
  }, 2200);
}
const resTipo = document.getElementById("res-tipo");
const labelVerdadera = document.getElementById("label-verdadera");
const resVerdadera = document.getElementById("res-verdadera");
const resConfiabilidadScore = document.getElementById("res-confiabilidad-score");
const filaAmarillismo = document.getElementById("fila-amarillismo");

const RELIABILITY_COLORS = [
  "#B71C1C",
  "#D32F2F",
  "#E53935",
  "#F4511E",
  "#FB8C00",
  "#FDD835",
  "#C0CA33",
  "#7CB342",
  "#43A047",
  "#2E7D32",
];

function clampReliabilityScore(value, isTrue) {
  let score = Number.parseInt(value, 10);
  if (!Number.isFinite(score)) {
    score = isTrue ? 8 : 2;
  }
  score = Math.max(1, Math.min(10, score));
  if (isTrue && score < 6) return 7;
  if (!isTrue && score > 4) return 3;
  return score;
}

function renderReliabilityScale(score) {
  if (!resVerdadera) return;
  resVerdadera.innerHTML = "";
  resVerdadera.setAttribute(
    "aria-label",
    `Reliability score ${score} out of 10`
  );

  for (let i = 1; i <= 10; i += 1) {
    const seg = document.createElement("span");
    seg.className = "reliability-seg";
    if (i === 1) seg.classList.add("first");
    if (i === 10) seg.classList.add("last");
    if (i <= score) seg.classList.add("active");
    if (i === score) seg.classList.add("current");
    seg.style.backgroundColor = RELIABILITY_COLORS[i - 1];
    seg.title = `${i}/10`;
    resVerdadera.appendChild(seg);
  }

  if (resConfiabilidadScore) {
    resConfiabilidadScore.textContent = `${score}/10`;
    resConfiabilidadScore.style.color = RELIABILITY_COLORS[score - 1];
  }
}
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

// After deploying on Render, replace with:
// "https://YOUR-SERVICE.onrender.com/verificar"
const BACKEND_URL = "http://127.0.0.1:8001/verificar";
let idAnalisisActivo = 0;

const VEREDICTO_LABEL = {
  falso: "False",
  enganoso: "Misleading",
  parcialmente_cierto: "Partially true",
  verdadero: "True",
  sin_verificar: "Unverified",
};

const VEREDICTO_COLOR = {
  falso: "#c62828",
  enganoso: "#ef6c00",
  parcialmente_cierto: "#FBC02D",
  verdadero: "#2e7d32",
  sin_verificar: "#7A8A9C",
};

const SENSATIONALISM_LABEL = {
  None: "None",
  Nulo: "None",
  Low: "Low",
  Bajo: "Low",
  Medium: "Medium",
  Medio: "Medium",
  High: "High",
  Alto: "High",
};

function showWelcome(show) {
  if (bienvenida) {
    bienvenida.style.display = show ? "block" : "none";
  }
  if (privacy) {
    privacy.style.display = show ? "flex" : "none";
  }
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = "block";
  resultado.style.display = "none";
  showWelcome(true);
}

function isRestrictedUrl(url) {
  if (!url) return true;
  const blocked = [
    "chrome://",
    "chrome-extension://",
    "edge://",
    "about:",
    "devtools://",
    "https://chrome.google.com/webstore",
    "https://chromewebstore.google.com",
  ];
  return blocked.some((prefix) => url.startsWith(prefix));
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_) {
    return url;
  }
}

function openInNewTab(url) {
  if (!url) return;
  chrome.tabs.create({ url });
}

function renderKeypoints(keypoints) {
  resKeypoints.innerHTML = "";
  if (!keypoints || !keypoints.length) {
    resKeypoints.innerHTML = '<li class="vacio">No key points detected.</li>';
    return;
  }

  for (const kp of keypoints) {
    const verdict = kp.veredicto || "sin_verificar";
    const li = document.createElement("li");
    li.className = verdict;
    li.innerHTML = `
      <div class="kp-veredicto" style="color:${VEREDICTO_COLOR[verdict] || "#757575"}">
        ${escapeHtml(VEREDICTO_LABEL[verdict] || verdict)}
      </div>
      <div class="kp-afirmacion">${escapeHtml(kp.afirmacion)}</div>
      <div class="kp-explicacion">${escapeHtml(kp.explicacion)}</div>
    `;
    resKeypoints.appendChild(li);
  }
}

function renderSources(sources) {
  resFuentes.innerHTML = "";
  if (!sources || !sources.length) {
    resFuentes.innerHTML =
      '<li class="vacio">No citable sources were found for this analysis.</li>';
    return;
  }

  for (const source of sources) {
    const li = document.createElement("li");
    const title = source.titulo || domainFromUrl(source.url) || "Source";
    const link = document.createElement("a");
    link.textContent = title;
    link.role = "button";
    link.tabIndex = 0;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openInNewTab(source.url);
    });
    link.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openInNewTab(source.url);
      }
    });

    const domain = document.createElement("div");
    domain.className = "fuente-dominio";
    domain.textContent = domainFromUrl(source.url);

    const snippet = document.createElement("div");
    snippet.className = "fuente-fragmento";
    snippet.textContent = source.fragmento || "";

    li.appendChild(link);
    li.appendChild(domain);
    if (source.fragmento) li.appendChild(snippet);
    resFuentes.appendChild(li);
  }
}

async function extractPageData(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["lib/Readability.js", "content.js"],
  });

  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      if (typeof globalThis.__verificadorExtraerDatos === "function") {
        return globalThis.__verificadorExtraerDatos();
      }
      return null;
    },
  });

  return results?.[0]?.result || null;
}

btn.addEventListener("click", async () => {
  const analysisId = ++idAnalisisActivo;
  btn.disabled = true;
  btn.style.display = "none";
  showWelcome(false);
  loading.style.display = "block";
  resultado.style.display = "none";
  errorBox.style.display = "none";
  setLoadingMessage(ANALYZE_STATUS_STEPS[0]);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error("Could not detect an active tab.");
    }

    if (isRestrictedUrl(tab.url)) {
      throw new Error(
        "This page cannot be analyzed. Open a news article on a normal website (not chrome:// or the Chrome Web Store)."
      );
    }

    setLoadingMessage("Extracting the article...");
    const articleData = await extractPageData(tab.id);
    if (analysisId !== idAnalisisActivo) return;
    const content = articleData?.content || "";

    if (content.trim().length < 80) {
      throw new Error(
        "Could not extract readable text from this site. Try opening the full article."
      );
    }

    setLoadingMessage("Cleaning the main content...");
    startStatusRotation(2);
    const backendResponse = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: articleData?.url || tab.url || "",
        domain: articleData?.domain || domainFromUrl(tab.url || ""),
        title: articleData?.title || tab.title || "",
        content,
        texto: content,
        links: articleData?.links || [],
      }),
    });
    if (analysisId !== idAnalisisActivo) return;
    stopStatusRotation();
    setLoadingMessage("Building your report...");

    if (!backendResponse.ok) {
      let detail = `Server error (${backendResponse.status})`;
      try {
        const err = await backendResponse.json();
        if (err.detail) {
          detail = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
        }
      } catch (_) {
        /* ignore */
      }
      throw new Error(detail);
    }

    const data = await backendResponse.json();
    const typeLabels = {
      noticia: "News",
      reportaje: "Feature / report",
      opinion: "Opinion",
      no_noticia: "Not news (spam/fake/other)",
    };
    const isJournalistic = data.tipo_contenido !== "no_noticia";

    resTipo.textContent = typeLabels[data.tipo_contenido] || "Unclassified content";
    resTipo.style.color = isJournalistic ? "#4A5C74" : "#512DA8";

    labelVerdadera.textContent = isJournalistic
      ? "Reliability:"
      : "Legitimacy:";
    const reliabilityScore = clampReliabilityScore(
      data.nivel_confiabilidad,
      data.es_verdadera
    );
    renderReliabilityScale(reliabilityScore);

    if (isJournalistic && data.nivel_amarillismo) {
      filaAmarillismo.style.display = "block";
      const level = data.nivel_amarillismo;
      resAmarillismo.textContent = SENSATIONALISM_LABEL[level] || level;
      resJustificacionAmarillismo.textContent =
        data.justificacion_amarillismo || "No justification available.";
      if (level === "High" || level === "Alto") {
        resAmarillismo.style.color = "#c62828";
      } else if (level === "Medium" || level === "Medio") {
        resAmarillismo.style.color = "#FBC02D";
      } else {
        resAmarillismo.style.color = "#2e7d32";
      }
    } else {
      filaAmarillismo.style.display = "none";
      resAmarillismo.textContent = "-";
      resJustificacionAmarillismo.textContent = "-";
    }

    resResumen.textContent =
      data.informe_correcciones || data.resumen || "No report available.";

    renderSources(data.fuentes);

    // Key points are shown only when the content is marked unreliable/false.
    if (!data.es_verdadera) {
      labelInforme.textContent = "Summary:";
      bloqueFalso.style.display = "block";
      tituloFuentes.textContent = "Sources that refute or correct";
      renderKeypoints(data.keypoints);
    } else {
      labelInforme.textContent = "Report / corrections:";
      bloqueFalso.style.display = "none";
      tituloFuentes.textContent = "Sources that support the story";
      resKeypoints.innerHTML = "";
    }

    resultado.style.display = "block";
  } catch (error) {
    stopStatusRotation();
    if (analysisId !== idAnalisisActivo) return;
    const message = error?.message || String(error);
    if (/Failed to fetch|NetworkError|fetch/i.test(message)) {
      showError(
        "Could not connect to the backend. Make sure it is running at http://127.0.0.1:8001"
      );
    } else if (/Cannot access|Cannot find|Receiving end does not exist/i.test(message)) {
      showError(
        "Chrome cannot inject scripts into this page. Open a news article on a normal website."
      );
    } else {
      showError(message);
    }
  } finally {
    stopStatusRotation();
    if (analysisId === idAnalisisActivo) {
      btn.disabled = false;
      btn.style.display = "inline-flex";
      loading.style.display = "none";
      setLoadingMessage(ANALYZE_STATUS_STEPS[0]);
    }
  }
});

chrome.tabs.onActivated.addListener(() => {
  idAnalisisActivo += 1;
  stopStatusRotation();
  btn.disabled = false;
  btn.style.display = "inline-flex";
  loading.style.display = "none";
  resultado.style.display = "none";
  errorBox.style.display = "none";
  showWelcome(true);
});
