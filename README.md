# MCU CRO

- `backend/` – Node.js + Express API on MySQL (`mysql2`) (`npm run dev`, port 2002)
- `frontend/` – React (Vite) (`npm run dev`, port 2001, proxies `/api` to the backend)
- `docs/` – setup guides (see `docs/m365-login.md` for sign-in and user setup)

## First-time setup

1. Set the `DB_*` values in `backend/.env` (MySQL host, port, database name, user, password).
2. In `backend/`: `npm install`, then `npm run db:migrate`. This creates the database if needed and applies `database/migrations/*.sql`.
3. Add the first administrator: `npm run user:create -- you@mcu.edu.ph admin "Your Name"`.
4. Start `npm run dev` in `backend/` and `frontend/`, then open http://localhost:2001/admin.

## Database changes

Add a new numbered file to `backend/database/migrations/` (for example `002_create_colleges.sql`) and run `npm run db:migrate`. Each file runs once; applied files are recorded in the `schema_migrations` table, so never edit a file after it has been applied.
