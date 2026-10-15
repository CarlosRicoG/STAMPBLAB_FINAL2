# STAMPLAB

Monorepo del proyecto STAMPLAB.

- `backend/`  API Node.js + Express + Sequelize (MySQL). Migraciones en `backend/migrations`.
- `frontend/` React + Vite + Tailwind.
- `docker-compose.yml` levanta MySQL + backend + frontend.

## Con Docker
```
cp .env.example .env     # completar valores
docker compose up --build
```
Frontend: http://localhost:5173 · API: http://localhost:3000

## Sin Docker
```
cd backend  && cp ../.env.example .env && npm install && npx sequelize-cli db:migrate && npm run dev
cd frontend && cp .env.example .env && npm install && npm run dev
```
