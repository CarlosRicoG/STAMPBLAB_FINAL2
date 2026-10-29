# Auditoría STAMPLAB_UNIFICADO

Primera auditoría y correcciones: 2026-10-28. Segunda validación (revisión independiente de los cambios y pasada nueva): 2026-10-28.
Documentos relacionados: `PRD.md` (producto) y `TDD.md` (diseño técnico).

**Niveles de confianza:** [V] verificado leyendo el código · [R] reportado por un auditor, no reproducido · [D] dudoso.
**Estado:** ✅ corregido · 🟡 mitigado en parte · ⏳ pendiente · ❓ decisión del negocio.

## 1. Resultado de la validación final

| Comprobación | Antes | Después |
|---|---|---|
| Tests backend (jest) | 187/187 | **216/216** (21 suites; se añadieron 29) |
| **Integración contra base real** (`backend/tests-integracion`, 11 suites) | no se había corrido | **11/11 pasan** (seguridad, validaciones, stock, cancelación, recuperación, sesiones, correos, comprobante, flujo, abuso, concurrencia) |
| **E2E de navegador** (Chrome, `e2e/`: `run`, `journey`, `mejoras-ui`, `abuso-ui`, `responsive-a11y`, `pdf-export`, `revision-cliente`, `vacios`) | no se había corrido | **8/8 terminan con código 0**, sin errores de consola |
| Verificación en vivo de las correcciones de negocio | — | **todas OK** (ver 1.1) |
| Tests frontend (vitest) | 46/46 | **46/46** |
| ESLint frontend | 45 errores, 20 avisos | **0 errores**, 20 avisos (`exhaustive-deps`) |
| Build frontend (vite, PWA) | — | compila |

**Cómo se probó:** se levantó una base MariaDB 12.3 **aislada y desechable** (puerto 3311, datos en el directorio temporal), se aplicaron las 7 migraciones desde cero, los seeds (`seed-base`, `seed-demo`, `seed-demo-flujo`), la API en el puerto 3100 y el frontend compilado. No se tocó la base de desarrollo del proyecto ni ningún servicio del equipo. Después se detuvo todo y se borró la base desechable.

**Defectos que apareció al correr contra una base real (todos corregidos):**
1. La migración `20261017-documento-bigint` **fallaba en MariaDB** al crear una base desde cero (`Can't DROP FOREIGN KEY`): ahora no hace nada si las columnas ya son BIGINT.
2. Con MariaDB 11.6+/12 (*snapshot isolation* activo por defecto), 9 de 12 compras simultáneas respondían **500** (`Record has changed since last read`) en vez de 400 por falta de stock. Se fijó `READ COMMITTED` en `config/config.js`; verificado 3 veces seguidas: 3 aceptadas y 9 rechazadas con 400.
3. `seed-demo-flujo.js` intentaba pasar un pedido de Pendiente a Entregada saltando estados (la máquina de estados lo rechaza): ahora recorre Pagada, En producción, Lista y Entregada.

### 1.1 Verificación en vivo de las correcciones (base real)
- Pedido de cliente sin color y talla: 400. `TraePrenda` x100000: 400 y stock intacto. `InventarioID` de otro producto: 400.
- Pedido válido descuenta 2 y cancelarlo devuelve exactamente 2.
- Cotización con 2 tallas: se fija costo, se aprueba; editar costo tras aprobar da 400, cambiar `ValorTotal` tras aprobar da 400, estado inexistente da 400. El cliente acepta y el pedido sale con **Total = valor aprobado (60.000)**, suma de líneas = total y **una línea por talla**.
- Venta directa con 2 tallas descuenta cada talla (-3 y -2) y cancelar las devuelve.
- `/api/estados/seed`: 404. `..%2f..%2fserver.js` y `..%2f.env`: 404. `/recuperar-password` x7: 200 x5 y 429 x2.

## 2. CRÍTICO (todos corregidos)

| # | Hallazgo | Estado | Corrección |
|---|---|---|---|
| C1 [V] | Lectura de archivos del servidor sin login: `GET /api/cotizaciones/imagen/..%2f.env` | ✅ | `getImagenDiseno` usa `path.basename`, lista blanca de caracteres y comprueba que el archivo quede dentro de `uploads/disenos`. Prueba automatizada. La ruta sigue pública a propósito (el panel carga la imagen con `<img>`; ver §5) |
| C2 [V] | `JWT_SECRET` por defecto `'clave_secreta'` | ✅ | Con `NODE_ENV=production` el servidor no arranca si falta o si vale `clave_secreta` o `cambiar`. Prueba automatizada |
| C3 [V] | `GET /api/estados/seed` público | ✅ | Ruta eliminada |
| C4 [V] | Inflado de stock con `TraePrenda` y pedidos sin color/talla | ✅ | `devolver` solo repone líneas con variante; `reservar` desliga las líneas que no usan inventario; la ruta del cliente exige color y talla y elimina `TraePrenda`. Pruebas automatizadas |

## 3. ALTO

| # | Hallazgo | Estado | Nota |
|---|---|---|---|
| A1 [R] | `sync.js` con `force:true` sin guarda | ✅ | Bloqueado con `NODE_ENV=production`; exige `--confirmar` (`npm run db:reset` ya lo incluye) |
| A2 [R] | Rate limit no cubría `/recuperar-password` ni `/registro` | ✅ | Límite por IP y por hora (5 y 20), configurable. **Requiere `TRUST_PROXY=1` detrás de un proxy**, o el límite vale para todo el sitio |
| A3 [R] | `InventarioID` no se validaba contra el producto | ✅ | Se rechaza si no coincide con producto, color o talla |
| A4 [R] | Total del pedido distinto al aprobado en la cotización (3 fórmulas) | ✅ | Una sola fórmula (`subtotalDetalle`); el pedido usa el `ValorTotal` aprobado y Σ líneas = total |
| A5 [R] | Costos editables en cotizaciones ya aprobadas | ✅ | El middleware `middleware/cotizacionEditable.js` bloquea crear, editar y borrar detalles, técnicas, tallas, colores e insumos de una cotización que no esté Pendiente o En revisión; además `updateCotizacion` y `aplicarTarifas`. Pruebas automatizadas |
| A6 [R] | Convertir cotización perdía tallas y colores | ✅ | Una línea de pedido por talla cotizada; si las cantidades por talla no suman la cantidad del producto, se usa una sola línea con la cantidad del producto |
| A7 [R] | Cotización sin diseños (venta directa) usaba solo la primera talla | ✅ | Una línea por talla pedida |
| A8 [R] | Variante desactivada se podía vender; stock negativo o texto al crear/editar | ✅ | Se rechaza variante inactiva; el stock debe ser entero ≥ 0 |
| A9 [R] | Carrera aceptar/rechazar/cancelar cotización y edición del admin | ✅ | `rechazar`, `cancelar` y `updateCotizacion` bajo bloqueo (`FOR UPDATE`); si el estado cambió mientras el admin editaba responde 409 |
| A10 [R] | Filtro HTML evadible con textos de 20000+ caracteres y con formularios urlencoded | ✅ | Regex lineal sin límite de longitud; `urlencoded` se procesa antes del filtro |
| A11 [R] | Usuario borrado conservaba sesión | 🟡 | Se invalidan sus sesiones antes de borrar. Con varias instancias o tras reiniciar, el token vive hasta 2 h |
| A12 [R] | `limit` sin tope en listados | ✅ | Tope 1000 en ventas y cotizaciones |
| A13 [R] | Vencimiento y cancelación: pedidos sin pago nunca vencen (contraentrega) | ❓ | Está documentado como intencional en el código. Ver PRD §7 |
| A14 [R] | Cancelar pedido pagado no devuelve stock | ❓ | Decisión de negocio, PRD §7 |
| A15 [R] | Roles y permisos decorativos (solo `RolID = 1`) | ❓ | PRD RF-30 |
| A16 [R] | `detallecompras` y `detalleventas` mueven stock/totales sin las reglas principales | ⏳ | Vía paralela que el panel no usa; consolidar o bloquear |
| A17 [R] | Cambiar contraseña o correo sin pedir la contraseña actual | ❓ | PRD §7 |
| A18 [R] | El admin del seed usa `Admin123*` si falta `NODE_ENV=production`; docker-compose la trae por defecto | ⏳ | Cambiar antes de publicar; con producción el seed exige `ADMIN_PASSWORD` |

### Frontend (alto)
| # | Hallazgo | Estado |
|---|---|---|
| F1 [V] | `redirectAfterLogin` se guardaba y nadie lo leía | ✅ (Login lo usa; ProtectedRoute y el 401 lo guardan; solo rutas internas) |
| F2 [R] | Sesión inconsistente entre `token`, `usuario` y `user` | ✅ (`cerrarSesion` y el 401 limpian las tres) |
| F3 [R] | El carrito se compartía entre usuarios del mismo equipo | ✅ (se borra al cerrar sesión voluntaria; **no** en un 401, para no perder el carrito al vencer la sesión) |
| F4 [R] | `fetch` sin comprobar `res.ok` (detalle de cotización, MisCompras, checkout, subida de diseño) | ✅ |
| F5 [R] | Precios del carrito congelados | ⏳ |
| F6 [R] | Crear cotización con producto personalizado siempre daba 400 (no enviaba `PrecioUnitario`) | ✅ |
| F7 [R] | Editar una talla con recargo borraba el precio | ✅ |
| F8 [R] | Volver al paso 1 al crear producto duplicaba el producto; variantes con `Promise.all` quedaban a medias | ✅ |
| F9 [R] | Diseño que falla al subir se ignoraba (admin) | ✅ |

## 4. MEDIO y BAJO

**Corregidos:** `NuevaVenta` doble clic y mensaje de error; contraseñas impresas en consola (`api-usuarios`); `config/api.js` con puerto 10000; `ErrorBoundary` (se reinicia al navegar); estados 6 y 7 en Mis cotizaciones; campana duplicada en el navbar; mensajes de error del backend perdidos en Tallas, Colores, Roles, Insumos y Ventas pendientes; doble clic al cambiar estado; validación de descripción de rol (10–100); texto de ayuda de contraseña (8–100); texto falso en `InsumoForm`; correo duplicado en `ProveedoresForm`; IDs de estado escritos a mano en `usuarioController` y `facturaController`; tipo `compra` inválido y borrado/cambio de tipo de los estados del sistema; `TRUST_PROXY` robusto; código muerto (`enum.js`, funciones no usadas de `Services`, `getUser`).

**También corregidos en la tercera ronda:** `updateCotizacion` bajo bloqueo; validación de cantidades por talla y color al cotizar (enteros positivos, la suma de tallas debe igualar la cantidad); un pedido de solo "prenda propia" sin diseños se rechaza (evita pedidos de $0); compras no admiten fecha futura; en producción las respuestas 5xx ya no exponen `error.message` del ORM (filtro central); teléfono y dirección se precargan al iniciar sesión; ruta `/formularioCompra` protegida; borrados `Dashboard.jsx`, `Icon.jsx` y `App.css` (huérfanos); quitadas las dependencias `jose`, `react-bootstrap` y `picomatch`.

**También corregidos en la segunda ronda:** el correo de recuperación se envía en segundo plano (el tiempo de respuesta ya no delata si el correo existe), el enlace de recuperación no se escribe en logs de producción y el nombre se escapa en el HTML del correo; máximo de dinero ajustado a `DECIMAL(10,2)` (antes un valor enorme daba 500); no se puede borrar una variante con pedidos pendientes que tienen stock reservado.

**ESLint:** los errores están en 0. Tras esos últimos cambios menores se corrieron lint, vitest y build; los E2E no se repitieron porque la base desechable ya se había borrado. Cuatro archivos "kit" (`ModalDetalleVenta.jsx`, `clienteKit.jsx`, `miCuentaKit.jsx`, `MedicionDesempeño.jsx`) llevan una excepción documentada de `react-refresh/only-export-components` (exportan a propósito componentes y utilidades juntos; solo afecta al recargado en caliente). Separarlos en archivos distintos queda como mejora opcional.

**Pendientes:**
- ⏳ 20 avisos `react-hooks/exhaustive-deps` (arreglarlos implica refactorizar lógica).
- ⏳ `PUT /inventarioproducto/:id` sobrescribe un valor absoluto: puede pisar ventas simultáneas (es lo que hace el formulario del panel).
- ⏳ Precio por catálogo (`/ventas`, base + talla) distinto al de cotización (suma además tela): decidir una regla.
- ⏳ Migración: las ventas pendientes anteriores a la columna `InventarioID` quedan sin ella. Se mitigó con un respaldo en `devolver` (resuelve por producto, color y talla); no hay *backfill* en la BD.
- ⏳ Los `Services` de compras, tallas e insumos siguen imprimiendo objetos de negocio con `console.log` (no son contraseñas).
- ✅ `CotizacionProducto` (modelo y controlador sin ruta y sin tabla en las migraciones vigentes): eliminado, junto con `detalleventas` y `detallecompras` (CRUD directo que saltaba las reglas de stock y totales), `PUT /api/cotizaciones/detalle/:id` (evadía el bloqueo de cotizaciones aprobadas) y `POST /api/usuarios/login` (duplicado del login con límite de intentos).
- ⏳ `GET /api/insumos` e `/inventarioproducto` son públicos y exponen costos y stock.
- ⏳ Compras: no valida que el insumo esté activo (hacerlo bloquearía editar compras históricas de insumos desactivados después).

## 5. Limitaciones y decisiones conocidas

- **Imágenes de diseño públicas:** `/uploads/disenos` y `/api/cotizaciones/imagen/:filename` se sirven sin login porque el panel las muestra con `<img src>`. Los nombres son `Date.now()-aleatorio`, no secretos fuertes. Si los diseños son confidenciales, hay que servirlos con token o con URL firmada.
- **Rate limits en memoria:** se reinician con el servidor y no se comparten entre instancias.
- **Las pruebas de integración ahora necesitan límites altos** (`REGISTRO_MAX_HORA`, `RECUPERAR_MAX_HORA`) o fallarán con 429 en una segunda corrida en la misma hora.
- **`JWT_SECRET=cambiar` con `NODE_ENV=production` hace caer el contenedor** (es lo buscado). El seed también exige `ADMIN_PASSWORD` en producción.

## 6. No cubierto

- Revisión humana línea por línea de todas las pantallas; la segunda pasada revisó contrato de API y lógica de catálogo, compras, roles y ventas pendientes.
- MySQL 8 (el motor de Docker): las pruebas se hicieron en MariaDB 12.3. El código no depende del motor, pero conviene correr `docker compose up --build` y `npm run test:integracion` una vez en el entorno real de despliegue.
- Despliegue real, correo SMTP real y servicios externos.
- Una tercera auditoría independiente de las últimas correcciones (middleware de cotización, `READ COMMITTED`, recuperación en segundo plano): se verificaron con pruebas automáticas, integración y E2E, pero no con revisión de un tercero.

## 7. Hallazgos de la segunda validación (resumen)

La revisión independiente de los cambios encontró errores **introducidos por las primeras correcciones**, ya corregidos:
- Pedidos antiguos sin `InventarioID` dejaban de reponer stock al cancelar (ahora se resuelven por producto, color y talla).
- El filtro HTML se saltaba con formularios `urlencoded` (se movió el orden de middlewares).
- `TRUST_PROXY=0` o `true` podía romper el arranque.
- Un total aprobado con subtotal calculado en 0, o cantidades por talla que no suman, producían pedidos con líneas en 0 o con cantidad distinta a la cobrada.
- El 401 del frontend vaciaba el carrito y perdía la ruta de origen.
