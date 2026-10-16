# STAMPLAB

Monorepo del proyecto STAMPLAB.

- `backend/`  API Node.js + Express + Sequelize (MySQL). Migraciones en `backend/migrations`.
- `frontend/` React + Vite + Tailwind.
- `docker-compose.yml` levanta MySQL + backend + frontend.

## Con Docker
```
cp .env.example .env     # completar valores
docker compose up --build
# solo la primera vez (crea las tablas en la BD vacia; NO repetir, borra los datos):
docker compose exec backend node sync.js
```
Frontend: http://localhost:5173 · API: http://localhost:3000

## Sin Docker
```
cd backend  && cp ../.env.example .env && npm install && node sync.js && npm run dev   # sync.js solo la primera vez (borra datos)
cd frontend && cp .env.example .env && npm install && npm run dev
```
