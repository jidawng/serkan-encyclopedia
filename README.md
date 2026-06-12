# SERKAN Encyclopedia Dashboard Prototype

SERKAN Lifestyle Encyclopedia / Routine Board prototype.

This is a static HTML/CSS/JavaScript prototype for reviewing:

- Daily and Weekly routine boards
- Routine detail manuals
- Product group and item encyclopedia
- Situation dashboard
- Guide and resources page
- Local edit mode and drag ordering

## Required Files

The prototype needs these files and folders:

- `index.html`
- `app.js`
- `app-data.js`
- `data/`
- `README.md`

## Run Locally

From this folder:

```bash
python3 -m http.server 8765
```

Open:

```text
http://127.0.0.1:8765/index.html
```

If the repo is served from the parent `Comm` folder, open:

```text
http://127.0.0.1:8765/serkan-dashboard-prototype/index.html
```

## QA Checklist

Before sharing with the team:

- `index.html` opens locally
- Browser console has no JavaScript errors
- `app.js` passes syntax check
- `app-data.js` passes syntax check
- Daily / Weekly routine boards render from data
- Cards and detail drawers open normally
- Search and edit controls are still available

## Notes

This repo is intended for a private team review before deployment. Do not expose private Notion notes, source dumps, or internal memo data in the UI.
