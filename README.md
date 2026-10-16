# STAMPLAB

Monorepo: tienda + panel administrativo para estampados.

- `backend/`  API Node.js + Express + Sequelize (MySQL).
- `frontend/` React + Vite + Tailwind.
- `docker-compose.yml` levanta MySQL + backend + frontend.

## Puesta en marcha (sin Docker)
```
# 1) Base de datos MySQL vacia (ej. stamplab_unificado) y credenciales en backend/.env
cd backend && cp .env.example .env && npm install
node sync.js                      # crea las tablas (SOLO la primera vez: borra datos)
node scripts/seed-base.js         # roles, estados (IDs fijos) y usuario administrador
node scripts/seed-demo.js         # catalogos, productos con variantes y stock, cliente demo
npm run dev                       # API en http://localhost:3000
node scripts/seed-demo-flujo.js   # (opcional, con la API arriba) compras, ventas y cotizaciones de ejemplo

# 2) Frontend
cd ../frontend && cp .env.example .env && npm install && npm run dev   # http://localhost:5173
```

## Con Docker
```
cp .env.example .env              # completar valores
docker compose up --build
docker compose exec backend node sync.js && docker compose exec backend node scripts/seed-base.js && docker compose exec backend node scripts/seed-demo.js
```

## Cuentas iniciales
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@stamplab.com` | `Admin123*` |
| Cliente demo | `cliente@stamplab.com` | `Cliente123*` |

Cambiar estas contraseñas antes de publicar. El seed del admin acepta `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_DOC`.

## Notas
- Los IDs de `estados` estan fijados en el codigo (cotizacion 1-7, venta 8-13); por eso existe `seed-base.js`.
- El panel `/dashboard` solo abre con rol Administrador.
- `JWT_SECRET` y `MAIL_USER`/`MAIL_PASS` van en variables de entorno (nunca en el codigo).
