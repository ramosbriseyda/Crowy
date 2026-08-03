# Verificador de Noticias (MVP)

Extensión de Chrome + backend FastAPI con Perplexity Sonar para analizar el contenido de una página: clasifica si es noticia, evalúa confiabilidad/amarillismo y, si es falsa, muestra keypoints y fuentes clicables.

## Estructura

- `extension/` — extensión Chrome (Manifest V3)
- `backend/` — API local en FastAPI + Perplexity Sonar

## Requisitos

- Python 3.10+
- Google Chrome
- API key de Perplexity ([API Portal](https://www.perplexity.ai/account/api))

## Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edita .env y pon PERPLEXITY_API_KEY=...
python main.py
```

El servidor queda en `http://127.0.0.1:8000`.

## Extensión

1. Abre `chrome://extensions`
2. Activa **Modo de desarrollador**
3. **Cargar descomprimida** → selecciona la carpeta `extension`
4. Con el backend corriendo, abre una noticia y pulsa el icono de la extensión
5. En el panel lateral, pulsa **Analizar Noticia**

## Notas

- No subas tu `.env` (contiene secretos). Usa `.env.example` como plantilla.
- El amarillismo solo se muestra cuando el contenido es una noticia/reportaje.
- Los keypoints y fuentes aparecen solo cuando el contenido se marca como no confiable/falso.
