# TimeWise - Complete One-Document Guide

This is the single source of truth for TimeWise.

It explains everything in one place:
- what the project is
- how to run locally
- how frontend/backend/database work
- how to test and debug
- how to host online
- what is needed for handover

---

## 1. Project Summary

TimeWise is a full-stack web application for weekly timesheet management.

Users can:
- sign in with Google
- fill timesheets
- map time to projects and tasks
- view reports
- manage roles (Admin/Manager/Employee/HR/Custom)

Technology stack:
- Frontend: React (port 3000)
- Backend API: Node.js + Express (port 8080)
- Database: PostgreSQL (port 5432)
- Runtime: Docker Compose

---

## 2. System Architecture (Simple View)

1. User opens the website in browser.
2. Frontend sends request to backend API.
3. Backend validates login/session.
4. Backend reads/writes PostgreSQL data.
5. Backend sends response.
6. Frontend updates screen.

Main URLs:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080

---

## 3. Repository Structure

```text
Timewise/
├── docker-compose.yml
├── README.md
├── timesheet/
│   └── timesheet/
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
    └── TimeWiseBackEnd/
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

Note:
- The __MACOSX folders are not required for runtime.

---

## 4. Prerequisites

### Required for local setup
- Docker Desktop
- Git

### Optional (manual/no-Docker mode)
- Node.js 20+
- npm
- PostgreSQL 16+

---

## 5. Local Run (Recommended - Docker)

This is the easiest method for managers and demos.

### Step-by-step

1. Clone repository

```bash
git clone https://github.com/humesh0905/timewise.git
cd timewise
```

2. Start Docker Desktop

3. Start all services

```bash
docker compose up -d --build
```

4. Open app
- Frontend: http://localhost:3000
- Backend check: http://localhost:8080

5. Stop services when done

```bash
docker compose down
```

6. If you need fresh database volume reset

```bash
docker compose down -v
```

---

## 6. Environment Configuration

Backend environment file location:
- TimeWiseBackEnd/TimeWiseBackEnd/.env

Use this template:

```env
PORT=8080
SESSION_SECRET=replace_with_long_random_secret

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
- DB host may differ by container naming in your machine.
- If DB connection fails, check running DB container name and update DB_HOST accordingly.

---

## 7. How Each Layer Works

### Frontend
- Located at timesheet/timesheet
- Built using React
- Handles UI, forms, page routing, and API calls
- API helper file: timesheet/timesheet/src/lib/api.js

### Backend
- Located at TimeWiseBackEnd/TimeWiseBackEnd
- Built using Express
- Handles auth, validation, business rules, role checks
- Route registration in src/app.js

### Database
- PostgreSQL stores all persistent records
- Schema evolves using Knex migrations
- Seed data loaded from seeds

---

## 8. Key Functional Modules

- Authentication: Google OAuth + session cookie
- Profile: view/update profile and password
- Timesheets: weekly entries, updates, deletes
- Projects and Tasks: map work to structured items
- Admin: users, roles, summaries
- Reports: user/weekly/project analytics
- Calendar: holiday view

---

## 9. API Overview

### Auth
- GET /auth/google
- GET /auth/google/callback
- GET /auth/status
- GET /auth/logout
- POST /auth/logout

### Profile
- GET /api/profile
- PUT /api/profile
- PUT /api/profile/password

### Timesheets
- GET /api/timesheets/:weekStart/entries
- POST /api/timesheets
- PUT /api/timesheets/entries/:entryId
- DELETE /api/timesheets/entries/:entryId

### Projects/Tasks
- GET /api/projects
- GET /api/projects/:projectId/tasks

### Admin
- GET /api/admin/users
- GET /api/admin/timesheets
- GET /api/admin/roles
- PUT /api/admin/users/:userId/role
- GET /api/admin/reports/users
- GET /api/admin/reports/weekly
- GET /api/admin/reports/projects

---

## 10. Database Management

### Docker mode
- Database starts automatically with compose.

### Manual mode
From backend folder:

```bash
npm install
npm run migrate:latest
npm run seed:run
```

---

## 11. Manual Run (Without Docker)

### Backend

```bash
cd TimeWiseBackEnd/TimeWiseBackEnd
npm install
npm run dev
```

### Frontend (new terminal)

```bash
cd timesheet/timesheet
npm install
npm start
```

---

## 12. Testing

### Frontend tests

```bash
cd timesheet/timesheet
npm test
```

### Backend tests
- No full automated backend unit test suite is currently configured.
- Validate by functional checks in browser:
  - login
  - profile update
  - timesheet create/update/delete
  - admin role update
  - reports loading

---

## 13. Debugging and Troubleshooting

### Check containers

```bash
docker ps
```

### Check logs

```bash
docker logs --tail 100 timewise_api
docker logs --tail 100 timewise_web
docker logs --tail 100 timewise_db
```

### Common problems and fixes

1) Frontend loads but API fails
- Confirm backend is running on 8080
- Check browser console and backend logs

2) Database connection error
- Verify DB_HOST, DB_USER, DB_PASS, DB_NAME
- Confirm DB container is healthy

3) Google login fails
- Verify client ID/secret
- Verify callback URL exact match in Google Cloud Console

4) Old UI still visible

```bash
docker compose up -d --build --no-deps web
```

5) Need clean demo data

```bash
docker exec timewise_db psql -U postgres -d timewise -c "DELETE FROM public.timesheet_entries; DELETE FROM public.timesheets;"
```

---

## 14. Security Basics

- Keep secrets only in .env files
- Never commit real secrets to GitHub
- Use strong SESSION_SECRET in all environments
- Use HTTPS in production
- Set secure cookies in production
- Restrict server/network ports

---

## 15. Hosting Online (Production)

## 15.1 What is needed

- VPS server (Ubuntu recommended)
- Domain name
- DNS control access
- SSL certificate (Let's Encrypt)
- Docker + Docker Compose on server
- Production environment variables
- Google OAuth app configured for production domain

Recommended minimum server:
- 2 CPU
- 4 GB RAM
- 40+ GB SSD

## 15.2 Deployment flow

1. Provision server
2. Install Docker and Docker Compose
3. Clone repository on server
4. Create production .env (backend)
5. Start services with docker compose
6. Configure Nginx reverse proxy
7. Attach domain and HTTPS
8. Update Google OAuth callback and allowed origins
9. Run smoke tests

## 15.3 Production checks

- App opens on your domain via HTTPS
- Login works with production callback URL
- API and session behavior works behind reverse proxy
- Database persists data after restart
- Logs show no critical errors

---

## 16. Non-Technical Manager Quick Start

1. Install Docker Desktop.
2. Download project from GitHub.
3. Open terminal in project folder.
4. Run: docker compose up -d --build
5. Open: http://localhost:3000
6. Login using Google.

If issue occurs:
- run docker ps
- collect logs from section 13
- share logs with technical team

---

## 17. Handover Checklist

Share these with the next owner/manager:
- this README
- GitHub repository access
- production server access
- domain/DNS access
- Google OAuth ownership/access
- secure environment variable values
- admin user details for app
- backup and restore plan for database

---

## 18. Useful Command Reference

```bash
# Start all services
docker compose up -d --build

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Restart API only
docker restart timewise_api

# Restart Web only
docker restart timewise_web

# Rebuild web service only
docker compose up -d --build --no-deps web
```

Manual backend commands:

```bash
cd TimeWiseBackEnd/TimeWiseBackEnd
npm run migrate:latest
npm run seed:run
```

---

## 19. Final Notes

- For local demos, Docker mode is best.
- For production, use HTTPS + secure environment setup.
- Keep this document updated whenever routes, env keys, or deployment flow changes.

This file is designed to be enough for both operations and management handover.
