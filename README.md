# TimeWise

TimeWise is a full-stack timesheet management system.

It helps teams:
- sign in securely
- log weekly work hours
- assign work to projects and tasks
- view reports
- manage user roles (Admin, Manager, Employee, HR, etc.)

This guide is written for both technical and non-technical users, so anyone can run the project on a local computer.

---

## 1) What Type of Project Is This?

TimeWise is a 3-tier web application:
- Frontend: React (user interface in browser)
- Backend: Node.js + Express (API and business logic)
- Database: PostgreSQL (stores users, projects, tasks, timesheets)

It is containerized with Docker, so all parts can run together with a single command.

---

## 2) High-Level Architecture

- Browser opens the frontend at `http://localhost:3000`
- Frontend calls backend API at `http://localhost:8080`
- Backend reads/writes data in PostgreSQL
- Login uses Google OAuth + session cookies

Simple request flow:
1. User opens frontend.
2. Frontend sends API request.
3. Backend validates user/session.
4. Backend queries database.
5. Backend returns response.
6. Frontend updates screen.

---

## 3) Main Features

- Google login and session-based authentication
- Profile view and update
- Weekly timesheet submission
- Project and task-based entries
- Admin dashboard
- Role assignment from UI
- Reports (users, weekly, projects)
- Calendar page

---

## 4) Project Folder Structure

```text
Timewise/
├── docker-compose.yml                    # Runs DB + API + Web containers
├── README.md                             # Main documentation (this file)
├── timesheet/
│   └── timesheet/                        # React frontend app
│       ├── Dockerfile
│       ├── package.json
│       ├── public/
│       └── src/
│           ├── components/
│           ├── context/
│           ├── layouts/
│           ├── lib/
│           └── pages/
└── TimeWiseBackEnd/
    └── TimeWiseBackEnd/                  # Node/Express backend app
        ├── Dockerfile
        ├── package.json
        ├── knexfile.js
        ├── migrations/
        ├── seeds/
        └── src/
            ├── app.js
            ├── index.js
            ├── config/
            ├── db/
            ├── middleware/
            └── routes/
```

Notes:
- `__MACOSX` folders are metadata from zip extraction on Mac. They are not required for runtime.
- `build/` in frontend is generated output and can be recreated.

---

## 5) Prerequisites (Install Once)

Install these on the local machine:
- Docker Desktop (recommended)
- Git

Optional (only for non-Docker/manual mode):
- Node.js 20+
- npm
- PostgreSQL 16+

---

## 6) Fastest Way to Run (Recommended: Docker)

From the project root (`Timewise` folder):

```bash
docker compose up -d --build
```

Then open:
- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8080`

To stop:

```bash
docker compose down
```

To stop and remove DB data:

```bash
docker compose down -v
```

---

## 7) Environment Variables (Backend)

Backend reads values from:
- `TimeWiseBackEnd/TimeWiseBackEnd/.env`

Create this file if missing.

Minimum example:

```env
PORT=8080
SESSION_SECRET=change_this_to_a_long_random_secret

DB_HOST=timewise_postgres
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=timewise
DATABASE_URL=postgres://postgres:postgres@timewise_postgres:5432/timewise?options=-csearch_path%3Dpublic

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH_CALLBACK_URL=http://localhost:8080/auth/google/callback
ALLOWED_EMAIL_DOMAIN=@gmail.com
```

Important:
- For local Docker, `DB_HOST` should match the DB container hostname used by your setup.
- If API cannot connect to DB, try setting `DB_HOST=timewise_db` if that is your active container name.

---

## 8) Database Setup

The backend uses PostgreSQL with:
- schema changes in `migrations/`
- seed data in `seeds/`

### Docker mode
Database container starts automatically from `docker-compose.yml`.

### Manual mode (no Docker)
1. Create database `timewise` in PostgreSQL.
2. Update backend `.env` DB values.
3. Run migrations and seeds (from backend folder):

```bash
npm install
npm run migrate:latest
npm run seed:run
```

---

## 9) Running Without Docker (Manual Developer Mode)

### Backend

```bash
cd TimeWiseBackEnd/TimeWiseBackEnd
npm install
npm run dev
```

Backend runs at `http://localhost:8080`.

### Frontend (new terminal)

```bash
cd timesheet/timesheet
npm install
npm start
```

Frontend runs at `http://localhost:3000`.

---

## 10) How Frontend and Backend Work Together

Frontend API layer:
- `timesheet/timesheet/src/lib/api.js`

It sends requests with cookies (`credentials: include`) so authenticated sessions are preserved.

Backend route registration:
- `TimeWiseBackEnd/TimeWiseBackEnd/src/app.js`

Main route groups:
- `/auth` -> login, callback, logout, auth status
- `/api/profile` -> profile data and password update
- `/api/timesheets` -> timesheet CRUD
- `/api/projects` -> projects and tasks
- `/api/admin` -> users, roles, reports

---

## 11) Core API Overview (Plain Language)

Auth:
- `GET /auth/google` -> start Google login
- `GET /auth/google/callback` -> login callback
- `GET /auth/status` -> check logged in user
- `GET|POST /auth/logout` -> sign out

Profile:
- `GET /api/profile`
- `PUT /api/profile`
- `PUT /api/profile/password`

Timesheets:
- `GET /api/timesheets/:weekStart/entries`
- `POST /api/timesheets`
- `PUT /api/timesheets/entries/:entryId`
- `DELETE /api/timesheets/entries/:entryId`

Projects/Tasks:
- `GET /api/projects`
- `GET /api/projects/:projectId/tasks`

Admin:
- `GET /api/admin/users`
- `GET /api/admin/timesheets`
- `GET /api/admin/roles`
- `PUT /api/admin/users/:userId/role`
- `GET /api/admin/reports/users`
- `GET /api/admin/reports/weekly`
- `GET /api/admin/reports/projects`

---

## 12) How to Test the Project

Frontend tests (React Testing Library):

```bash
cd timesheet/timesheet
npm test
```

Backend currently has no automated unit test suite configured.

Recommended backend validation:
- open app and test login flow
- create/update/delete timesheet entries
- test profile update and password update
- verify admin role assignment and reports

---

## 13) How to Debug Problems

### Check running containers

```bash
docker ps
```

### Check logs

```bash
docker logs --tail 100 timewise_api
docker logs --tail 100 timewise_web
docker logs --tail 100 timewise_db
```

### Common issues and fixes

1. Frontend opens but API calls fail
- confirm backend is running on port 8080
- check CORS/session settings in backend

2. Database connection error
- verify DB host in `.env` (`timewise_postgres` vs `timewise_db`)
- confirm DB container is healthy

3. Google login not working
- verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- callback URL in Google Console must match `OAUTH_CALLBACK_URL`

4. Old/stale UI still visible
- rebuild web container:

```bash
docker compose up -d --build --no-deps web
```

5. Need clean DB for fresh demo

```bash
docker exec timewise_db psql -U postgres -d timewise -c "DELETE FROM public.timesheet_entries; DELETE FROM public.timesheets;"
```

---

## 14) Role and Access Model

Typical roles:
- Admin: manage users, roles, reports
- Manager: review team activity (based on your business rules)
- Employee: fill timesheets
- HR/Custom roles: configurable in DB and admin UI

Role checks are enforced in backend middleware and admin endpoints.

---

## 15) Security Notes

- Session cookie is HTTP-only.
- OAuth is delegated to Google.
- In production, set secure cookies and HTTPS.
- Keep secrets only in `.env` (never commit secrets to GitHub).

---

## 16) Deployment Readiness Checklist

Before hosting on a server:
- use strong `SESSION_SECRET`
- configure production DB credentials
- enable HTTPS
- set cookie `secure=true`
- update frontend and OAuth URLs to production domain
- verify CORS origin in backend for production frontend URL

---

## 17) Quick Start for Non-Technical Manager

1. Install Docker Desktop.
2. Download this project from GitHub.
3. Open terminal in project root (`Timewise`).
4. Run: `docker compose up -d --build`
5. Open browser: `http://localhost:3000`
6. Use Google login to enter the app.

If anything fails:
- run `docker ps`
- share container logs from section 13

---

## 18) Useful Commands Reference

```bash
# Start everything
docker compose up -d --build

# Stop everything
docker compose down

# Restart API only
docker restart timewise_api

# Rebuild frontend only
docker compose up -d --build --no-deps web

# Backend migrations (manual mode)
cd TimeWiseBackEnd/TimeWiseBackEnd
npm run migrate:latest

# Backend seeds (manual mode)
npm run seed:run
```

---

## 19) Ownership and Maintenance

If you hand over this project to another person, share:
- this `README.md`
- `.env` template (without real secrets)
- Google OAuth app credentials (securely)
- basic admin login/testing checklist

This is enough for a new owner to run, verify, and maintain the system locally.
