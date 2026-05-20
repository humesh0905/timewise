# Quickstart — Run TimeWise (Manager-friendly)

This short guide is focused on getting the app running quickly on a laptop and fixing the npm credential prompt if it appears.

Sections:
- Quick Docker demo (recommended)
- Run locally without Docker (developer)
- Fix npm / Jenkins credential prompts
- Create `.env` from templates
- Quick troubleshooting commands

---

## 1) Quick Docker demo (recommended)

1. Install Docker Desktop and ensure it is running.
2. Open a terminal in the project root folder (the folder that contains `docker-compose.yml`).
3. Run:

```bash
docker compose up -d --build
```

4. Open the app in your browser:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8080

5. To stop:

```bash
docker compose down
```

Notes:
- This avoids using your local Node/npm and prevents registry/auth prompts.

---

## 2) Run frontend/backend locally (no Docker)

Only use this if you prefer running on your machine.

Backend:

```bash
cd TimeWiseBackEnd/TimeWiseBackEnd
# create .env from template if not present, then install and run
copy .env.example .env          # PowerShell
npm install
npm run dev
```

Frontend:

```bash
cd timesheet/timesheet
copy .env.example .env          # PowerShell (only if needed)
npm install
npm start
```

Open: http://localhost:3000

---

## 3) Why npm asks for Jenkins/email-password and how to fix it

Why this happens:
- Your machine has an npm configuration that points to a private registry (company Artifactory or similar) which requires authentication. npm then prompts for credentials.
- This is a local environment issue — the project itself does not require Jenkins credentials.

Quick fixes (recommended order):

A) Use Docker (no npm on host) — see section 1.

B) Reset npm registry to public npm and try again:

```powershell
npm config get registry
# if it is not https://registry.npmjs.org/ then run:
npm config set registry https://registry.npmjs.org/
```

C) Check and temporarily rename global `.npmrc` if it contains credentials:

```powershell
# show file if exists
if (Test-Path $env:USERPROFILE\.npmrc) { type $env:USERPROFILE\.npmrc }
# temporarily move it out of the way
if (Test-Path $env:USERPROFILE\.npmrc) { Rename-Item $env:USERPROFILE\.npmrc $env:USERPROFILE\.npmrc.backup }
```

D) If a package in `package.json` references a private URL, we can inspect and update it. To search for non-public registries in the repo (on a machine with Git):

```bash
git grep -n "registry" || git grep -n "http://" | grep -i "npm\|artifactory\|jenkins\|private"
```

If you paste the output here I will advise next steps.

---

## 4) Creating `.env` files from templates

I added `.env` templates to the repo. Copy them and fill values as needed.

Backend (Docker mode can work with defaults, but set `SESSION_SECRET`):

```powershell
cd TimeWiseBackEnd\TimeWiseBackEnd
Copy-Item .env.example .env
# edit .env to set SESSION_SECRET and Google OAuth values if required
```

Frontend (only needed for local dev without Docker):

```powershell
cd timesheet\timesheet
Copy-Item .env.example .env
# edit REACT_APP_API_BASE if backend is not at http://localhost:8080
```

---

## 5) Quick troubleshooting commands (copy-paste)

Docker status:

```bash
docker ps
```

See logs (tail last 100 lines):

```bash
docker logs --tail 100 timewise_api
docker logs --tail 100 timewise_web
docker logs --tail 100 timewise_db
```

Check npm registry and .npmrc (PowerShell):

```powershell
npm config get registry
if (Test-Path $env:USERPROFILE\.npmrc) { type $env:USERPROFILE\.npmrc }
```

Restore `.npmrc` if you renamed it:

```powershell
if (Test-Path $env:USERPROFILE\.npmrc.backup) { Rename-Item $env:USERPROFILE\.npmrc.backup $env:USERPROFILE\.npmrc }
```

---

If you want, I can:
- Add screenshots to this file (you'll need to provide images), or
- Walk your manager through these steps over a quick video call or chat.

