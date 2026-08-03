async function configurarPanelLateral() {
  try {
    await chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true,
    });
  } catch (error) {
    console.error("[Verificador] No se pudo configurar el panel lateral:", error);
  }
}

chrome.runtime.onInstalled.addListener(configurarPanelLateral);
chrome.runtime.onStartup.addListener(configurarPanelLateral);

// También se ejecuta cuando el service worker se inicia o se recarga.
configurarPanelLateral();
