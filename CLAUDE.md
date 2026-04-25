# CLAUDE.md — MyCurrencyConverter

## Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (semantic, accessibility-aware) |
| Styles | CSS3 (custom properties, flexbox, responsive) |
| Logic | Vanilla JavaScript ES6+ (IIFE, async/await) |
| Offline / PWA | Service Worker (`sw.js`), Web App Manifest (`manifest.json`) |
| Data persistence | `localStorage` (caches exchange rates between sessions) |
| Exchange rate data | ExchangeRate-API — `https://open.er-api.com/v6/latest/USD` (free tier, no API key) |
| Typography | Google Fonts — Inter |
| Deployment | GitHub → Netlify (auto-deploy on push to `master`) |
| Version control | Git / GitHub (`Anthony-Agovino/currency-dashboard`) |

**There is no build step, no package manager (npm/yarn), and no JavaScript framework.** Every file you see is exactly what the browser runs.

---

## Run / Build / Deploy Commands

### Run locally
```bash
# Start a local static file server on port 8080
python3 -m http.server 8080
# Then open: http://localhost:8080
```
> Note: The Service Worker requires a real HTTP server — opening `index.html` directly from the file system (`file://`) will not work correctly.

### Build
There is no build step. The repository files are the production files.

### Deploy to production
```bash
# Commit your changes, then push to master
git add <changed-files>
git commit -m "your message"
git push origin master
```
Netlify watches the `master` branch and auto-deploys within ~1 minute of every push. No manual deploy command is needed.

---

## Working with Me (PM Rules)

1. **Plain English always.** I am a non-technical Product Manager. Explain all errors, trade-offs, or required decisions in plain English — no jargon without an immediate explanation.
2. **Small, pure functions.** Prefer adding small, single-purpose functions over modifying large blocks of existing code.
3. **One step at a time.** When a task requires multiple steps, execute them one at a time and ask for approval before moving to the next step.
4. **State what you found before changing anything.** Before editing a file, briefly describe what is already there and what you plan to change.

---

## Off-Limits Zones — DO NOT TOUCH without explicit approval

These files control how the app is cached, installed, and deployed. Editing them incorrectly can break offline support for all users, corrupt PWA installs, or cause failed deployments.

| File | Why it is sensitive |
|---|---|
| `sw.js` | Service Worker — controls what the browser caches. Changing `CACHE_NAME` forces every user to re-download the entire app. Breaking the fetch logic breaks offline mode. |
| `manifest.json` | PWA manifest — defines the app icon, name, and install behavior. Changing `start_url`, `icons`, or `display` can break "Add to Home Screen" on mobile devices. |
| `icons/icon-192.png` `icons/icon-512.png` | App icons referenced by the manifest. Replacing them requires a matching `manifest.json` update and a `CACHE_NAME` bump in `sw.js`. |
| `.git/` | Git internals — never edit directly. |

> **Rule of thumb:** if a change touches caching, deployment, or the installed-app experience, ask before proceeding.
