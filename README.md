# Crowy

Chrome extension + local backend (FastAPI) that analyzes page content: classifies whether it is news, evaluates reliability/sensationalism, and when it looks false, shows key points and clickable sources.

Built for the **UNESCO Youth Hackathon**.

> **Note on size:** the project itself is very small (~0.2 MB). If you see ~200 MB in your folder, it is almost certainly the Python virtual environment (`backend/.venv` or `backend/venv`), which **should not be uploaded to GitHub**. It is created on your machine when you install dependencies.

## Structure

- `extension/` — Chrome extension (Manifest V3)
- `backend/` — local FastAPI + Perplexity Sonar API

## Requirements

- [Python 3.10+](https://www.python.org/downloads/) (check **Add Python to PATH**)
- [Google Chrome](https://www.google.com/chrome/)
- A Perplexity API key ([API Portal](https://www.perplexity.ai/account/api))

---

## Quick start: download and run

### 1) Download the project

**Option A — ZIP (simplest)**

1. Open the GitHub repo: [ramosbriseyda/Crowy](https://github.com/ramosbriseyda/Crowy)
2. Click the green **Code** button → **Download ZIP**
3. Extract the ZIP into a folder (for example `Documents\Crowy`)

**Option B — Git**

```powershell
git clone https://github.com/ramosbriseyda/Crowy.git
cd Crowy
```

### 2) Start the backend

Open PowerShell in the project folder and run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

1. Open `backend/.env` in a text editor.
2. Set your key like: `PERPLEXITY_API_KEY=your_key_here`
3. Save the file.
4. Start the server:

```powershell
python main.py
```

Leave that window open. The backend runs at `http://127.0.0.1:8000`.

> If PowerShell blocks virtual environment activation, run once:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 3) Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the project’s `extension` folder
5. Open a news article in the browser
6. Click the Crowy icon (or open the side panel) and then **Analyze news**

### 4) If something fails

| Problem | What to check |
| --- | --- |
| “Could not connect to the backend” | The server must be running (`python main.py`) on port 8000 |
| API error / empty analysis | Check that `PERPLEXITY_API_KEY` is set correctly in `backend/.env` |
| `python` is not recognized | Reinstall Python with **Add to PATH**, or use `py -3` instead of `python` |
| Extension does not appear | Make sure you loaded the `extension` folder, not the project root |

---

## Notes

- Do not upload your `.env` (it contains secrets). Use `.env.example` as a template.
- Do not upload `backend/.venv` or `backend/venv` to GitHub; they are local dependencies.
- Sensationalism is shown only when the content is news/feature reporting.
- Key points and sources appear when the content is marked unreliable/false.
