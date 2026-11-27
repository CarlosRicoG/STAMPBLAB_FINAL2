# STAMPLAB

Monorepo: tienda + panel administrativo para estampados.

- `backend/`  API Node.js + Express + Sequelize (MySQL).
- `frontend/` React + Vite + Bootstrap.
- `docker-compose.yml` levanta MySQL + backend + frontend.

## Puesta en marcha (sin Docker)
```
# 1) Base de datos MySQL vacia (ej. stamplab_unificado) y credenciales en backend/.env
cd backend && cp .env.example .env && npm install
npm run db:setup                  # migraciones (baseline congelado + posteriores) + roles, estados y administrador
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
Cabeceras de seguridad (CSP): el contenedor del frontend usa `frontend/serve.json`, que admite una API por `http:` o `https:` (para abrirlo por la IP de la red local); en Vercel, `frontend/vercel.json` solo permite APIs `https:`. Cuando se conozca el dominio real de la API, conviene fijarlo en `connect-src` (en lugar de `https:`) en ambos archivos.

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
- **CORS:** `CORS_ORIGIN` (orígenes del frontend separados por coma) es **obligatorio en producción**: con `NODE_ENV=production` y sin él la API no arranca. Fuera de producción, sin definirlo, se aceptan los de desarrollo (`http://localhost:5173`, `http://127.0.0.1:5173` y el despliegue de Vercel).
- **Salud:** `GET /api/salud` responde `200 { "estado": "ok" }` si la base de datos responde y `503 { "estado": "error" }` si no (o si tarda más de 3 s); nunca da detalles internos y no aparece en el registro de peticiones. Lo usa el healthcheck de docker-compose y sirve para un balanceador o monitor.

## Pruebas
| Que | Como | Cuantas |
|---|---|---|
| Backend (unitarias, sin BD) | `cd backend && npm test` (`npm run test:cov` con umbral de cobertura, el que usa CI) | 356 |
| Backend (integracion: seguridad, validaciones, stock, cancelar, recuperacion, sesiones, correos, comprobante, **mejoras de flujo**, **abuso** (entradas hostiles), **concurrencia**) | `cd backend && npm run test:integracion` (con la API y la BD demo arriba; con `MAIL_MODO=archivo` prueba los correos) | 11 conjuntos |
| Frontend (token automatico, roles, estados, efectos, datos de pago, precios del carrito) | `cd frontend && npm test` | 66 |
| E2E modulos (tienda, roles, panel, compra, registro) | `cd e2e && npm install && npm test` (corre `run.js`; también en CI) | 35 |
| E2E **recorrido completo** cliente -> administrador (registro, cotiza con diseno, precio, aprueba, convierte, compra con comprobante, estados, cancela) | `cd e2e && node journey.js` | 50 |
| E2E **movil (390px) + accesibilidad** (sin scroll lateral, alt, nombres de botones, etiquetas, h1, idioma) | `cd e2e && node responsive-a11y.js` | 20 |
| E2E **exportar PDF** del panel de indicadores | `cd e2e && node pdf-export.js` | 2 |
| E2E **interfaz hostil** (formularios vacíos/basura, XSS, doble clic, cantidades absurdas, sesión borrada, rutas ajenas, botón atrás) | `cd e2e && node abuso-ui.js` | 35 |
| E2E **mejoras de flujo** (campana de notificaciones, hamburguesa, "Hoy", aceptar cotización, Mi cuenta) | `cd e2e && node mejoras-ui.js` | 25 |
| E2E **estados vacios** (todas las pantallas sin datos; requiere una instancia con BD vacia) | `cd e2e && BASE_URL=... API_URL=... node vacios.js` | 30 |
| E2E **revision del cliente** (seguimiento, comprobante rechazado, volver a pedir, tipo de entrega, estimado, Mi cuenta) | `cd e2e && node revision-cliente.js` | 18 |

Variables utiles al probar: `API_URL`, `BASE_URL`, y `JWT_SECRET` (la prueba de recuperacion firma el enlace con el secreto real del servidor; en Docker usa el de tu .env).

Son 8 scripts E2E (los de la tabla). Para dejar la BD en el estado que esperan las pruebas: `cd backend && npm run db:reset && node scripts/seed-demo-flujo.js`.

- **Carrito entre E2E:** el carrito del cliente demo (1000000002) se guarda en el servidor. `revision-cliente.js` lo vacía al terminar (`PUT /api/carrito` con `{ items: [] }`) y `run.js` lo vacía antes de comprar; sin eso, correr `run.js` después de otra prueba que dejó productos hacía que su compra llevara más de 1 unidad. Una prueba E2E nueva que use el carrito del cliente demo debe dejarlo vacío al salir.
- **CI** (`.github/workflows/ci.yml`): backend con umbral de cobertura (`npm run test:cov`), frontend (lint, pruebas, build) y un job de integración que levanta MySQL, aplica las migraciones, comprueba que el esquema migrado coincide con los modelos (`node scripts/comprobar-esquema.js`), corre los 11 conjuntos de integración y después las E2E de `run.js` con Chrome contra el frontend compilado (`serve` + `serve.json`).
- **Esquema:** `backend/migrations/20261015000000-baseline.js` es DDL congelado (no depende de los modelos). Todo cambio de modelo necesita su migración; `node scripts/comprobar-esquema.js` (con las variables `DB_*`) falla si la base migrada y los modelos no coinciden en columnas, tipos o nulabilidad.

## Sesiones, correos y comprobante

- **Sesiones:** cada token tiene un id; `POST /api/logout` lo invalida y cambiar/recuperar la contraseña cierra todas las sesiones del usuario. El token se renueva solo mientras se usa (cabecera `X-Token-Renovado`). Duración: `SESION_DURACION` (por defecto 2h).
- **Correos al cliente:** pedido recibido, cambios de estado y cotizaciones. `MAIL_USER`/`MAIL_PASS` envían de verdad; `MAIL_MODO=archivo` los guarda en memoria (solo desarrollo); sin configuración solo se registran en consola y nada falla.
- **Comprobante PDF:** `GET /api/ventas/:id/factura` (cliente dueño o administrador); botón *Descargar comprobante* en Mis compras y en el detalle del pedido. No es factura electrónica DIAN.
- **Pedidos entregados:** el administrador no puede eliminar pedidos pagados, en producción o entregados (son historial); solo cancelarlos.
- **Indicadores:** cuentan pedidos (no líneas) del año en curso y usan la hora de Colombia (`ZONA_HORARIA`, por defecto `-05:00`).
- **Respaldo:** `cd backend && npm run respaldo` copia `uploads/` y exporta la base si `mysqldump` está instalado (carpeta `RESPALDO_DIR`).
- `seed-demo` queda bloqueado con `NODE_ENV=production` (crea cuentas con claves conocidas).

## Flujo cliente ⇄ administrador

- **Notificaciones en la aplicación (campana):** cada acción importante avisa a la otra parte. El administrador recibe aviso cuando un cliente cotiza, pide, sube un comprobante, acepta/rechaza/cancela; el cliente, cuando su cotización tiene precio, su pedido cambia de estado (con la nota del equipo), se rechaza su comprobante o algo vence. Panel con *Activas / Historial*, marcar leído y archivar (igual que el del ERP). Además llegan por correo (ver `MAIL_*` y `ADMIN_NOTIFY_EMAIL`).
- **Menú del administrador:** botón de hamburguesa que abre/cierra el menú lateral, contadores de pendientes en cada grupo y la bandeja **Hoy** (cotizaciones por atender, comprobantes por revisar, pedidos por avanzar y stock bajo, con acciones directas).
- **Cotización → pedido:** el administrador pone el precio y aprueba; el **cliente acepta o rechaza** desde *Mis cotizaciones*. Al aceptar se crea el pedido y se reserva el stock. **Tarifas** por técnica y parte agilizan poner precio ("Aplicar tarifas"); el cliente ve un **estimado** antes de enviar.
- **Datos para transferir:** la cuenta del negocio se configura con `PAGO_BANCO`, `PAGO_TIPO_CUENTA`, `PAGO_CUENTA`, `PAGO_TITULAR`, `PAGO_DOCUMENTO` y `PAGO_NOTA`; se muestra al pagar y en *Mis compras*. Sin `PAGO_CUENTA` no se muestra nada.
- **Pedido que nace de una cotización:** llega sin método de pago; el cliente lo paga por transferencia subiendo el comprobante en *Mis compras* y tiene el mismo plazo `PLAZO_PAGO_HORAS`.
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
