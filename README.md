# STAMPLAB

Monorepo: tienda + panel administrativo para estampados.

- `backend/`  API Node.js + Express + Sequelize (MySQL).
- `frontend/` React + Vite + Tailwind.
- `docker-compose.yml` levanta MySQL + backend + frontend.

## Puesta en marcha (sin Docker)
```
# 1) Base de datos MySQL vacia (ej. stamplab_unificado) y credenciales en backend/.env
cd backend && cp .env.example .env && npm install
npm run db:setup                  # migraciones (crean las 27 tablas) + roles, estados y administrador
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
# el contenedor del backend ya corre las migraciones y crea el administrador al arrancar
docker compose exec backend node scripts/seed-demo.js   # (opcional) datos de demostracion
```

## Cuentas iniciales
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@stamplab.com` | `Admin123*` |
| Cliente demo | `cliente@stamplab.com` | `Cliente123*` |

Cambiar estas contraseñas antes de publicar. El seed del admin acepta `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_DOC`.

## Seguridad (quién puede qué)
| Quién | Puede |
|---|---|
| Visitante (sin sesión) | Ver catálogo de la tienda (productos, colores, tallas, insumos, técnicas, partes). Login, registro y recuperar contraseña |
| Cliente (rol 2) | Lo anterior + crear sus pedidos y cotizaciones, ver **solo lo suyo** y editar su perfil (no puede cambiarse el rol) |
| Administrador (rol 1) | Todo: panel `/dashboard`, crear/editar/borrar y ver ventas, compras, cotizaciones, usuarios |

- El registro público **siempre** crea clientes (se ignora cualquier `RolID`).
- Máximo de intentos **fallidos** de login por IP cada 15 min: `AUTH_MAX_FALLOS` (por defecto 15) → respuesta 429.
- El frontend adjunta el token automáticamente a todas las llamadas (`src/utils/authInterceptors.js`) y cierra la sesión si vence.
- Cabeceras de seguridad con `helmet`. Los `console.log` de depuración se silencian con `NODE_ENV=production`.

## Imagenes
- Las fotos de productos y tecnicas se guardan como **archivos** en `backend/uploads/` (la BD solo guarda la ruta) y la API devuelve `PUBLIC_URL/uploads/...`. Maximo 5 MB por imagen (png/jpg/webp/gif).
- Para convertir imagenes antiguas que estaban en base64: `node scripts/migrar-imagenes.js` (seguro de repetir).
- En produccion define `PUBLIC_URL` con la URL publica del backend y respalda la carpeta `uploads/`.

## Notas
- Los IDs de `estados` estan centralizados en `backend/config/estados.js` (y `frontend/src/config/estados.js`); `seed-base.js` los carga desde ahi.
- El panel `/dashboard` solo abre con rol Administrador.
- `JWT_SECRET` y `MAIL_USER`/`MAIL_PASS` van en variables de entorno (nunca en el codigo).
