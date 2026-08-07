# Crowy

Extensión de Chrome + backend local (FastAPI) para analizar el contenido de una página: clasifica si es noticia, evalúa confiabilidad/amarillismo y, si parece falsa, muestra keypoints y fuentes clicables.

> **Nota sobre el tamaño:** el proyecto en sí pesa muy poco (~0.2 MB). Si ves ~200 MB en tu carpeta, casi seguro es el entorno virtual de Python (`backend/.venv` o `backend/venv`), que **no debe subirse a GitHub**. Se crea en tu máquina al instalar dependencias.

## Estructura

- `extension/` — extensión Chrome (Manifest V3)
- `backend/` — API local en FastAPI + Perplexity Sonar

## Requisitos

- [Python 3.10+](https://www.python.org/downloads/) (marca la opción **Add Python to PATH**)
- [Google Chrome](https://www.google.com/chrome/)
- API key de Perplexity ([API Portal](https://www.perplexity.ai/account/api))

---

## Guía rápida: descargar y hacer que funcione

### 1) Descargar el proyecto

**Opción A — ZIP (más simple)**

1. Abre el repositorio en GitHub: [ramosbriseyda/Crowy](https://github.com/ramosbriseyda/Crowy)
2. Pulsa el botón verde **Code** → **Download ZIP**
3. Extrae el ZIP en una carpeta (por ejemplo `Documents\Crowy`)

**Opción B — Git**

```powershell
git clone https://github.com/ramosbriseyda/Crowy.git
cd Crowy
```

### 2) Arrancar el backend

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

1. Abre el archivo `backend/.env` con un editor de texto.
2. Pon tu clave así: `PERPLEXITY_API_KEY=tu_clave_aqui`
3. Guarda el archivo.
4. Arranca el servidor:

```powershell
python main.py
```

Deja esa ventana abierta. El backend queda en `http://127.0.0.1:8000`.

> Si PowerShell bloquea la activación del entorno virtual, ejecuta una vez:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 3) Cargar la extensión en Chrome

1. Abre Chrome y ve a `chrome://extensions`
2. Activa **Modo de desarrollador** (arriba a la derecha)
3. Pulsa **Cargar descomprimida**
4. Selecciona la carpeta `extension` del proyecto
5. Abre una noticia en el navegador
6. Pulsa el icono de Crowy (o abre el panel lateral) y luego **Analizar Noticia**

### 4) Si algo falla

| Problema | Qué revisar |
| --- | --- |
| “No se pudo conectar con el backend” | El servidor debe estar corriendo (`python main.py`) en el puerto 8000 |
| Error de API / análisis vacío | Revisa que `PERPLEXITY_API_KEY` esté bien en `backend/.env` |
| `python` no se reconoce | Reinstala Python marcando **Add to PATH**, o usa `py -3` en lugar de `python` |
| La extensión no aparece | Confirma que cargaste la carpeta `extension`, no la raíz del proyecto |

---

## Notas

- No subas tu `.env` (contiene secretos). Usa `.env.example` como plantilla.
- No subas `backend/.venv` ni `backend/venv` a GitHub; son dependencias locales.
- El amarillismo solo se muestra cuando el contenido es una noticia/reportaje.
- Los keypoints y fuentes aparecen solo cuando el contenido se marca como no confiable/falso.
