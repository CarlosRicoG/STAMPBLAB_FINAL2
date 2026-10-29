# TDD — Documento de diseño técnico de STAMPLAB

Versión 1.0 · 2026-10-28. Complementa al `PRD.md` (qué se construye) con el cómo. Los hallazgos y su estado están en `AUDITORIA.md`.

## 1. Arquitectura

```
Navegador (React 19 + Vite + Tailwind, PWA)
        │  HTTPS, JSON, Bearer JWT
        ▼
API Node.js 22 + Express 5  ──►  MySQL 8 (Sequelize 6)
        │
        ├─ uploads/ (imágenes en disco: productos, técnicas, diseños)
        ├─ correo (nodemailer; modos: SMTP, archivo, consola)
        └─ trabajo periódico (vencimientos, cada hora)
```

Monorepo:

| Carpeta | Contenido |
|---|---|
| `backend/` | API, modelos, migraciones, servicios, scripts y pruebas |
| `frontend/` | SPA React (landing, panel y cliente) |
| `e2e/` | Pruebas de navegador (recorridos completos) |
| `docker-compose.yml` | MySQL + backend + frontend |

## 2. Backend

### 2.1 Capas

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Entrada | `server.js` | Middlewares globales, montaje de rutas, errores, arranque |
| Rutas | `routes/` | Autorización por ruta, validación Joi, reglas de propiedad |
| Controladores | `controllers/` | Casos de uso |
| Servicios | `services/` | Reglas transversales: inventario, sesión, historial, notificaciones, correo, vencimientos, configuración |
| Modelos | `models/` | Sequelize (27 tablas) y asociaciones |
| Configuración | `config/` | JWT, base de datos, IDs de estados y transiciones |

### 2.2 Middlewares globales (en orden)
1. `helmet` (cabeceras) y `cors` (lista blanca `CORS_ORIGIN`; expone `X-Token-Renovado`).
2. Normalización de errores: toda respuesta 4xx/5xx trae `message` y `mensaje`.
3. `express.json` (12 MB), `ocultarSecretos` (quita hashes de toda respuesta) y `rechazarHtml` (400 si el texto trae etiquetas).
4. Estáticos: `/uploads/disenos`, `/uploads/productos`, `/uploads/tecnicas`.
5. Límites por IP: login (solo intentos fallidos), recuperación de contraseña (5 por hora) y registro (20 por hora).

### 2.3 Autorización
- `verificarToken`: valida el JWT, rechaza tokens de recuperación como sesión, revisa revocación y versión de sesión, y reemite el token si le queda poco (cabecera `X-Token-Renovado`).
- `admin`: token válido y `RolID = 1`.
- `adminParaEscritura`: GET, HEAD y OPTIONS públicos (catálogo); el resto exige administrador.
- `propioOAdmin` y guardas por recurso (`ventaPropiaOAdmin`, `cotizacionPropiaOAdmin`): un cliente solo accede a lo suyo.

| Prefijo | Acceso |
|---|---|
| `/api/login`, `/api/registro`, `/api/recuperar-password`, `/api/restablecer-password` | Público (con límites) |
| `/api/productos`, `/colores`, `/tallas`, `/insumos`, `/tecnicas`, `/partes`, `/inventarioproducto`, `/estados` | Lectura pública, escritura administrador |
| `/api/ventas`, `/api/cotizaciones`, `/api/usuarios`, `/api/notificaciones`, `/api/carrito`, `/api/tarifas` | Autenticado; el cliente solo ve lo suyo |
| `/api/roles`, `/permisos`, `/privilegios`, `/rolpermisos`, `/permisoprivilegios`, `/proveedores`, `/compras`, `/detallecotizaciones`, `/cotizaciontecnicas`, `/cotizaciontallas`, `/cotizacioncolores`, `/cotizacioninsumos`, `/resumen` | Solo administrador |
| `/api/cotizaciones/imagen/:filename` | Público (el nombre se sanea; ver §6) |

### 2.4 Modelo de datos (resumen)

- **Acceso:** `Rol`, `Permiso`, `Privilegio`, `RolPermiso`, `PermisoPrivilegio`, `Usuario` (clave `DocumentoID` BIGINT, `SesionesVersion`), `SesionRevocada`.
- **Catálogo:** `Producto`, `Color`, `Talla` (con `Precio`), `Insumo` (`Tipo`, `PrecioTela`), `Tecnica`, `Parte`, `TarifaTecnica`, `InventarioProducto` (variante: producto + color + talla + tela, `Stock`, `Estado`).
- **Cotizaciones:** `Cotizacion`, `DetalleCotizacion`, `CotizacionTecnica`, `CotizacionTalla`, `CotizacionColor`, `CotizacionInsumo`.
- **Ventas:** `Venta`, `DetalleVenta` (guarda `InventarioID`, la variante exacta descontada), `Estado` (tipos `venta` y `cotizacion`), `HistorialEstado`.
- **Compras:** `Proveedor`, `Compra`, `DetalleCompra`.
- **Experiencia:** `Notificacion`, `Carrito`.

Migraciones activas: `backend/migrations/2026101*` (la baseline usa `sync()`); las anteriores (incluidas las automáticas de 2025) están en `migrations/legacy/`.

### 2.5 Estados (fuente única: `config/estados.js`)

Cotización: 1 Pendiente, 2 Aprobada, 3 Rechazada, 4 Cancelada, 5 Procesada, 6 En revisión, 7 Vencida.
Venta: 8 Pendiente, 9 Pagada, 10 En producción, 11 Entregada, 12 Cancelada, 13 Lista para entrega.

```
Venta:  Pendiente ─► Pagada ─► En producción ─► Lista ─► Entregada
            └──────────┴────────────┴────────────┴──► Cancelada
        (En producción también puede ir directo a Entregada)

Cotización: Pendiente/En revisión ─► Aprobada ─► (cliente) Procesada + crea Venta
                                          ├─► Rechazada
            Pendiente/En revisión/Aprobada ─► Vencida (por tiempo)
            cualquiera abierta ─► Cancelada
```

### 2.6 Reglas de diseño críticas

**Inventario (`services/inventario.js`) — única puerta para mover stock de ventas.**
- `reservar(lineas, t)`: agrupa por variante, bloquea las filas en orden ascendente de `InventarioID` (`FOR UPDATE`), valida existencia, estado activo y stock, y descuenta. Asigna `linea.InventarioID`.
- Una línea solo usa inventario si no es `TraePrenda`, tiene producto y tiene `InventarioID` o color y talla; las demás quedan con `InventarioID = null`.
- Si llega un `InventarioID`, debe pertenecer al producto (y color o talla si se indican); si no, error 400.
- `devolver(detalles, t)`: repone las líneas con `InventarioID` guardado. Los pedidos anteriores a esa columna (sin `InventarioID`) se resuelven por producto, color y talla; una línea sin variante ni color y talla (prenda propia) no repone nada. Los pedidos de cliente nuevos siempre llevan variante, porque la ruta exige color y talla.
- La venta directa de una cotización sin diseños (`crearVentaDirecta`) y la conversión de una cotización aprobada (`convertirCotizacionAVenta`) generan una línea de pedido por talla.
- Rutas de cliente (`routes/ventas.js`): cada línea exige color y talla, se elimina `TraePrenda` y el precio se valida contra catálogo (`PrecioBase` + talla).

**Precio de cotización — una sola fórmula (`subtotalDetalle`).**
- Producto con `PrecioUnitario` propio: `PrecioUnitario × Cantidad`. Si no: `PrecioBase × Cantidad` + Σ `PrecioTela × CantidadRequerida` + Σ `Talla.Precio × Cantidad por talla`.
- Siempre suma `CostoTecnica × Cantidad` por técnica.
- `calcularValorTotalCotizacion` solo recalcula en Pendiente o En revisión (o al aprobar). Después el valor queda **congelado**.
- Al convertir en pedido: `total = ValorTotal aprobado`; el precio unitario de cada línea es `subtotal × (total / Σ subtotales) / unidades`. Σ líneas = total. Hay una línea por talla cotizada.
- Al crear una cotización, las cantidades por talla y color deben ser enteros positivos y, si cada talla trae su cantidad, deben sumar la cantidad del producto (esquema Joi `cotizacion`).
- Crear, editar o borrar cualquier parte de una cotización (detalle, técnica, talla, color, insumo) exige que esté Pendiente o En revisión: lo aplica el middleware `middleware/cotizacionEditable.js` sobre sus rutas. Los costos y precios deben ser ≥ 0.

**Concurrencia.** `convertirCotizacionAVenta`, `rechazarCotizacion`, `cancelarCotizacion`, `updateCotizacion` (responde 409 si el estado cambió mientras se editaba), `updateEstadoVenta` y los vencimientos leen la fila bajo `FOR UPDATE` dentro de una transacción. El aislamiento por defecto es `READ COMMITTED` (`config/config.js`): con `REPEATABLE READ` y snapshot isolation (MariaDB 11.6+/12) una compra simultánea fallaba con `Record has changed since last read`; así responde 400 por falta de stock.

**Sesiones (`services/sesion.js`).** Cada token lleva `jti` y `sv`. Logout revoca el `jti`; cambiar contraseña o borrar usuario sube `SesionesVersion`. La validación usa copia en memoria refrescada cada 30 s.

**Vencimientos (`services/vencimientos.js`).** Cada hora y 30 s tras arrancar: cancela pedidos por transferencia sin comprobante válido pasado `PLAZO_PAGO_HORAS`, vence cotizaciones y purga notificaciones archivadas de más de 90 días.

## 3. Frontend

- React 19, React Router 7, Axios y `fetch`, SweetAlert2, Recharts, Tailwind 4 y Bootstrap, `vite-plugin-pwa`.
- Rutas en `src/routes/routes.jsx`, con carga diferida y `ErrorBoundary`. `ProtectedRoute` protege las rutas del cliente y `adminOnly` el panel.
- Servicios de API en `src/Services/api-*`. La URL base viene de `VITE_API_URL` (`src/config/api.js`).
- `src/utils/authInterceptors.js` añade el token, guarda el token renovado y cierra la sesión en 401.
- `src/config/estados.js` es el espejo de los IDs de estado del backend (mantener iguales).
- Datos de sesión en `localStorage`: `token` y `usuario`. El carrito local usa `cart_productos_landing` y se limpia al cerrar sesión.

## 4. Configuración y despliegue

Variables principales (ver `.env.example`): `DB_*`, `JWT_SECRET` (**obligatorio y no puede ser un valor de ejemplo con `NODE_ENV=production`**), `CORS_ORIGIN`, `PUBLIC_URL`, `FRONTEND_URL`, `MAIL_*`, `ADMIN_*`, `PLAZO_PAGO_HORAS`, `VIGENCIA_COTIZACION_DIAS`, `COSTO_ENVIO`, `STOCK_MINIMO`, `AUTH_MAX_FALLOS`, `RECUPERAR_MAX_HORA`, `REGISTRO_MAX_HORA`, `TRUST_PROXY`.

Docker: MySQL 8 con healthcheck; el backend ejecuta migraciones y `seed-base.js` al arrancar; el frontend se compila y se sirve con `serve`. En producción: `NODE_ENV=production`, `TRUST_PROXY=1` si hay proxy, contraseña de administrador propia (`ADMIN_PASSWORD`) y puerto de MySQL no publicado.

`sync.js` (recrea todas las tablas) está bloqueado en producción y exige `--confirmar` en cualquier otro entorno.

## 5. Estrategia de pruebas

| Nivel | Herramienta | Qué cubre |
|---|---|---|
| Unitarias backend | Jest, sin BD (216 pruebas, 21 suites) | Controladores con modelos simulados, `services/inventario`, `middleware/cotizacionEditable`, configuración de seguridad, saneamiento |
| Integración | `backend/tests-integracion` (con API y BD demo) | Seguridad, validaciones, stock, cancelaciones, sesiones, correos, concurrencia |
| Unitarias frontend | Vitest | Interceptores, rutas protegidas, estados, utilidades |
| E2E | `e2e/` (navegador) | Recorrido cliente → administrador, móvil y accesibilidad, interfaz hostil |

**Casos que protegen las reglas críticas — automatizados hoy** (`backend/__tests__/inventario.test.js` y `seguridad-config.test.js`):
- Stock: reponer solo líneas con `InventarioID`; `TraePrenda` no mueve stock; `InventarioID` de otro producto se rechaza; variante inactiva se rechaza; stock insuficiente no descuenta.
- Seguridad: sin `JWT_SECRET` seguro la app no arranca en producción; `getImagenDiseno` rechaza `../`, `..\` y subcarpetas.

**Verificados contra base real el 2026-10-28** (verificación puntual, no incluida en el repositorio): pedido de cliente sin color y talla da 400; `TraePrenda` no salta el control de stock; `InventarioID` de otro producto da 400; cancelar devuelve el stock exacto; cotización con 2 tallas, aprobar, bloqueo de edición y aceptar con total igual al aprobado y una línea por talla; venta directa con 2 tallas; `/api/estados/seed` da 404; `..%2f` da 404; más de 5 solicitudes por hora a `/recuperar-password` dan 429.

**Pendiente:** convertir esos casos en pruebas permanentes de `backend/tests-integracion/`.

**Cómo correr todo en una base aislada** (probado): crear una base vacía, `npx sequelize-cli db:migrate`, `node scripts/seed-base.js`, `node scripts/seed-demo.js`, arrancar la API con `AUTH_MAX_FALLOS`, `RECUPERAR_MAX_HORA` y `REGISTRO_MAX_HORA` altos y `MAIL_MODO=archivo`, `node scripts/seed-demo-flujo.js` y `npm run test:integracion`. Para `e2e/vacios.js` se usa una base sin `seed-demo`.

## 6. Decisiones de diseño y limitaciones conocidas

| Tema | Decisión o límite |
|---|---|
| `/api/cotizaciones/imagen/:filename` | Se mantiene público porque el panel muestra la imagen con `<img src>` (sin cabecera de token), igual que `/uploads/disenos`, que también es público. El nombre se sanea y se limita a `uploads/disenos`. Los nombres no son secretos fuertes: tratarlos como "público por enlace". |
| Revocación al borrar un usuario | Se sube la versión de sesión antes de borrar. Otras instancias del servidor solo lo ven mientras exista la fila; en ese caso el token vence por tiempo (máximo 2 h). |
| Roles y permisos | Solo se aplica `RolID = 1`. Los permisos del CRUD de roles no se evalúan en el servidor. |
| Cancelación de pedido pagado | No repone stock (a la espera de la decisión de negocio 1 del PRD). |
| Respuestas de error | Algunos `catch` locales devuelven `error.message` del ORM; con `NODE_ENV=production` el normalizador de `server.js` lo elimina de toda respuesta 5xx. |
| Migraciones | La baseline crea tablas con `sync()`: en bases antiguas puede faltar alguna columna nueva (`Insumo.PrecioTela`, `Talla.Precio`). La migración `20261017` es idempotente (no toca las claves foráneas si el tipo ya es BIGINT), así que funciona en MySQL y en MariaDB. |
