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
cp .env.example .env              # completar valores (contraseñas, JWT_SECRET)
docker compose up --build         # MySQL + API + web: http://localhost:5173  (API en :3000)
# el contenedor del backend ya corre las migraciones y crea el administrador al arrancar
docker compose exec backend node scripts/seed-demo.js   # (opcional) datos de demostracion
```

Si 3306/3000/5173 ya estan ocupados, cambia `HOST_DB_PORT`, `HOST_BACKEND_PORT`, `HOST_FRONTEND_PORT` en `.env` (y ajusta `CORS_ORIGIN`, `PUBLIC_URL`, `VITE_API_URL`, `FRONTEND_URL` a esos puertos).
Probado: el stack completo levanta desde cero en Docker y pasa las pruebas de integracion y E2E.
Para correr las pruebas contra Docker sube `AUTH_MAX_FALLOS`, `RECUPERAR_MAX_HORA` y `REGISTRO_MAX_HORA` (p. ej. 5000) en `.env`: las pruebas hacen intentos de login fallidos a proposito.

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

## Pruebas
| Que | Como | Cuantas |
|---|---|---|
| Backend (unitarias, sin BD) | `cd backend && npm test` | 165 |
| Backend (integracion: seguridad, validaciones, stock, cancelar, recuperacion, sesiones, correos, comprobante, **mejoras de flujo**, **abuso** (entradas hostiles), **concurrencia**) | `cd backend && npm run test:integracion` (con la API y la BD demo arriba; con `MAIL_MODO=archivo` prueba los correos) | 10 conjuntos |
| Frontend (token automatico, roles, estados, efectos) | `cd frontend && npm test` | 22 |
| E2E modulos (tienda, roles, panel, compra, registro) | `cd e2e && npm install && npm test` | 40 |
| E2E **recorrido completo** cliente -> administrador (registro, cotiza con diseno, precio, aprueba, convierte, compra con comprobante, estados, cancela) | `cd e2e && node journey.js` | 50 |
| E2E **movil (390px) + accesibilidad** (sin scroll lateral, alt, nombres de botones, etiquetas, h1, idioma) | `cd e2e && node responsive-a11y.js` | 20 |
| E2E **exportar PDF** del panel de indicadores | `cd e2e && node pdf-export.js` | 2 |
| E2E **interfaz hostil** (formularios vacíos/basura, XSS, doble clic, cantidades absurdas, sesión borrada, rutas ajenas, botón atrás) | `cd e2e && node abuso-ui.js` | 35 |
| E2E **mejoras de flujo** (campana de notificaciones, hamburguesa, "Hoy", aceptar cotización, Mi cuenta) | `cd e2e && node mejoras-ui.js` | 25 |
| E2E **estados vacios** (todas las pantallas sin datos; requiere una instancia con BD vacia) | `cd e2e && BASE_URL=... API_URL=... node vacios.js` | 30 |

Variables utiles al probar: `API_URL`, `BASE_URL`, y `JWT_SECRET` (la prueba de recuperacion firma el enlace con el secreto real del servidor; en Docker usa el de tu .env).

Para dejar la BD en el estado que esperan las pruebas: `cd backend && npm run db:reset && node scripts/seed-demo-flujo.js`.

## Sesiones, correos y comprobante

- **Sesiones:** cada token tiene un id; `POST /api/logout` lo invalida y cambiar/recuperar la contraseña cierra todas las sesiones del usuario. El token se renueva solo mientras se usa (cabecera `X-Token-Renovado`). Duración: `SESION_DURACION` (por defecto 2h).
- **Correos al cliente:** pedido recibido, cambios de estado y cotizaciones. `MAIL_USER`/`MAIL_PASS` envían de verdad; `MAIL_MODO=archivo` los guarda en memoria (solo desarrollo); sin configuración solo se registran en consola y nada falla.
- **Comprobante PDF:** `GET /api/ventas/:id/factura` (cliente dueño o administrador); botón *Descargar comprobante* en Mis compras y en el detalle del pedido. No es factura electrónica DIAN.
- **Pedidos entregados:** el administrador no puede eliminar pedidos pagados, en producción o entregados (son historial); solo cancelarlos.
- **Respaldo:** `cd backend && npm run respaldo` copia `uploads/` y exporta la base si `mysqldump` está instalado (carpeta `RESPALDO_DIR`).
- `seed-demo` queda bloqueado con `NODE_ENV=production` (crea cuentas con claves conocidas).

## Flujo cliente ⇄ administrador

- **Notificaciones en la aplicación (campana):** cada acción importante avisa a la otra parte. El administrador recibe aviso cuando un cliente cotiza, pide, sube un comprobante, acepta/rechaza/cancela; el cliente, cuando su cotización tiene precio, su pedido cambia de estado (con la nota del equipo), se rechaza su comprobante o algo vence. Panel con *Activas / Historial*, marcar leído y archivar (igual que el del ERP). Además llegan por correo (ver `MAIL_*` y `ADMIN_NOTIFY_EMAIL`).
- **Menú del administrador:** botón de hamburguesa que abre/cierra el menú lateral, contadores de pendientes en cada grupo y la bandeja **Hoy** (cotizaciones por atender, comprobantes por revisar, pedidos por avanzar y stock bajo, con acciones directas).
- **Cotización → pedido:** el administrador pone el precio y aprueba; el **cliente acepta o rechaza** desde *Mis cotizaciones*. Al aceptar se crea el pedido y se reserva el stock. **Tarifas** por técnica y parte agilizan poner precio ("Aplicar tarifas"); el cliente ve un **estimado** antes de enviar.
- **Pago por transferencia:** el administrador puede **rechazar el comprobante con un motivo** y el cliente sube otro. Un pedido sin pago se cancela solo pasadas `PLAZO_PAGO_HORAS` horas (devuelve el stock); una cotización sin respuesta pasa a *Vencida* tras `VIGENCIA_COTIZACION_DIAS` días. Los de contra entrega y los que tienen comprobante en revisión nunca se cancelan solos.
- **Seguimiento:** línea de tiempo con fechas y notas, fecha estimada de entrega, retiro en tienda o envío a domicilio (`COSTO_ENVIO`), datos del cliente congelados en el pedido, **Volver a pedir**, carrito sincronizado entre equipos, página **Mi cuenta** y botones de **WhatsApp** (`WHATSAPP`).
- Variables de entorno de todo esto: ver `backend/.env.example`. El mantenimiento automático corre cada hora (`JOBS_DESACTIVADOS=1` lo apaga).

## Inventario y concurrencia
Todo movimiento de stock por ventas/cotizaciones pasa por `backend/services/inventario.js`: transaccion + bloqueo de filas (`SELECT ... FOR UPDATE`) + una variante exacta por linea (`detalleventa.InventarioID`). Garantiza que dos compradores a la vez no venden la misma unidad, que cancelar/borrar el mismo pedido varias veces devuelve el stock una sola vez, y que una cotizacion no se convierte dos veces. `tests-integracion/concurrencia.js` lo vigila.

## Imagenes
- Las fotos de productos y tecnicas se guardan como **archivos** en `backend/uploads/` (la BD solo guarda la ruta) y la API devuelve `PUBLIC_URL/uploads/...`. Maximo 5 MB por imagen (png/jpg/webp/gif).
- Para convertir imagenes antiguas que estaban en base64: `node scripts/migrar-imagenes.js` (seguro de repetir).
- En produccion define `PUBLIC_URL` con la URL publica del backend y respalda la carpeta `uploads/`.

## Notas
- Los IDs de `estados` estan centralizados en `backend/config/estados.js` (y `frontend/src/config/estados.js`); `seed-base.js` los carga desde ahi.
- El panel `/dashboard` solo abre con rol Administrador.
- `JWT_SECRET` y `MAIL_USER`/`MAIL_PASS` van en variables de entorno (nunca en el codigo).

## Documentación
- `docs/PRD.md`: qué hace el sistema y sus reglas de negocio.
- `docs/TDD.md`: diseño técnico (módulos, rutas, modelos).
- `docs/AUDITORIA.md`: hallazgos de seguridad y calidad, y su estado.
- Migraciones vigentes en `backend/migrations/`; las históricas están en `backend/migrations/legacy/`.
