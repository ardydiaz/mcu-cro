# MCU CRO

- `backend/` – Node.js + Express API (`npm run dev`, port 2002)
- `frontend/` – React (Vite) (`npm run dev`, port 2001, proxies `/api` to the backend)
- `docker-compose.yml` – local Postgres (`docker compose up -d`)
