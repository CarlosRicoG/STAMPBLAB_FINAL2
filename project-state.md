# project-state.md — STAMPLAB_UNIFICADO

**Qué es:** tienda + panel administrativo para estampados (monorepo backend/frontend/e2e).
**Modo:** Velonet (octopus-agents) · autonomía semiautomática · criticidad **alta** (ventas, pagos, datos personales de clientes).
**Diseño:** tokens propios del proyecto en `frontend/src/config/tokens.js`.

## Fase actual
Mejoras derivadas de la auditoría del 2026-11-04, en la rama `mejoras-auditoria`. Plan por olas:
1. **Ola 1 (sin cambio de comportamiento):** hecha (commit 6c50524). Hecho: audit fix de joi, dockerignore, USER node en frontend, quitar Tailwind, import dinámico de jspdf/html2canvas, `config/api.js` unificado, `PUBLIC_URL`, renombres `*Form.jsx`, docs, CI.
2. **Ola 2:** hecha. Límite JSON de 100 kb solo en login/registro/recuperación (el resto sigue en 12 MB por comprobantes e imágenes), puerto 3306 ligado a 127.0.0.1, dashboard sin pedidos cancelados y con `mes` validado (400 si no es 1-12). `ADMIN_PASSWORD` NO se hizo obligatoria en el compose para no romper el `.env` existente; solo se documentó.
3. **Ola 3:** integridad (bloqueos en compras, atomicidad al aprobar cotización, índices, vencimiento de pedidos sin método de pago, índice único en inventario).
4. **Ola 4:** refactor de componentes/controladores grandes (requiere autorización aparte).

## Auditoría del 2026-11-25 y Ola A (rama `ola-a-dinero-sesion`, desde `correcciones-validacion`), sin commitear
Hallazgos nuevos y plan por olas en `docs/AUDITORIA.md` §9. Ola A hecha (2026-11-26): logout revoca toda la sesión (`sid`) + tope `SESION_VIDA_MAXIMA_HORAS`; `updateVenta` recalcula totales con envío; el carrito del servidor se vacía al comprar; no se borra un pedido con reembolso pendiente; plazo del comprobante rechazado desde `ComprobanteFechaRechazo` (migración 20261126000000); subir/rechazar comprobante y vencimiento bajo bloqueo (409 si cambió el comprobante); `POST /ventas` solo Pendiente/Pagada.
Ola B hecha (2026-11-26, detalle en `docs/AUDITORIA.md` §9), incluido el defecto de sesión al re-registrar un documento borrado. **Cambio de despliegue:** con `NODE_ENV=production` la API no arranca sin `CORS_ORIGIN`.
Variables nuevas para añadir a mano en `.env.example` (solo lectura en el entorno): `SESION_VIDA_MAXIMA_HORAS=24`, `DISENOS_MAX_HORA=30`, `DISENOS_HUERFANOS_HORAS=24`.
Ola D (rendimiento) hecha el 2026-11-26, con E2E 8/8 sobre el código final.
**Estado al 2026-11-27 (rama `ola-a-dinero-sesion`, NO integrada en `main`):** además de A, B y D hay, en el último commit de la rama: Ola C (habeas data: política `/privacidad` en BORRADOR, autorización en el registro, descargar y suprimir datos, `HistorialDesde` al re-registrar un documento suprimido), cierre del "pago por verificar" (backend y panel), Ola E (refactor de la tienda y del panel sin cambio de comportamiento, menú móvil del panel), migración base congelada + `comprobar-esquema`, cobertura mínima y E2E en CI.
**Verificado:** jest 433, vitest 191, lint, migraciones desde cero (14) y esquema = 30 modelos, integración 11/11.
**PENDIENTE antes de pasar a `main`:** los 8 recorridos E2E sobre este código no se completaron (el equipo se quedó sin memoria y el sistema detuvo los procesos; una corrida previa quedó invalidada por usar una compilación equivocada). Tampoco se comparó el panel en escritorio con capturas antes/después. `vacios.js` pendiente. Hacerlo uno por uno y con poca memoria libre.
**Para el negocio:** completar los marcadores `[RAZÓN SOCIAL]`, `[NIT]`… de `frontend/src/config/privacidad.js` y pasar la política por un asesor legal; añadir las variables nuevas al `.env.example` de la raíz (solo lectura en el entorno): ver `backend/.env.example`; definir `CORS_ORIGIN` en producción.
Siguientes: revisión legal de la política; decidir si se borra la tabla `cotizacionproducto` y se añaden las claves de `tarifas_tecnica` (desajustes viejos).

## Rama `correcciones-validacion` (2026-11-13), commiteada (5 commits sobre `main`), sin desplegar
Validación completa (pruebas, integración, E2E y lectura de código del flujo cliente, admin y seguridad) y correcciones:
- **Cliente:** el pedido que nace de una cotización aceptada se paga por transferencia (sube comprobante en Mis compras) y vence con `PLAZO_PAGO_HORAS`; datos para transferir configurables (`PAGO_*`, se muestran al pagar y en Mis compras); el carrito se pone al día con los precios del catálogo; cancelar con comprobante sin revisar avisa al admin ("pago por verificar").
- **Admin:** "Editar" solo en pedidos pendientes; dirección de entrega visible también en transferencia con envío; aviso de cancelación coherente con el stock; bandeja "Hoy" liviana (2.7 KB en vez de 700 KB: el comprobante se pide al abrirlo) y con totales reales; el contador "Hoy" del menú coincide con la bandeja; indicadores por pedidos, año en curso y hora de Colombia.
- **Seguridad:** el PDF de cotización ya no descarga URLs del cliente; `ImagenDiseño` solo acepta nombres de archivo; `insumos[].CantidadRequerida` validada; el cliente no fija `FechaCotizacion`; comprobante validado en el servidor (imagen/PDF real, 5 MB); urlencoded limitado a 100 kb; cancelación del cliente comprobada bajo bloqueo; límites en datos de entrega.
- **Rendimiento/infra:** compresión gzip en la API; índices `ventas_estado_fecha` y `cotizaciones_estado_fecha` (migración 20261112000000); el frontend ya no tiene avisos de `npm audit`; CI con trabajo de integración (MySQL + API real) — **no verificado en GitHub**, solo la sintaxis del YAML.
- **Limpieza:** se borró `FormularioCompra.jsx` (inalcanzable, con datos bancarios de relleno) y los `console.log` de compras, tallas e insumos.
- No tocado: `.env.example` (solo lectura en el entorno; faltan las líneas `PAGO_*` y `ZONA_HORARIA`), `NODE_ENV`/`ADMIN_PASSWORD` por defecto del compose, contraentrega, varios administradores, paginar el resto de listados, comprobantes como archivo, Ola 4.

## Decisiones pendientes
- Contraentrega: hoy hay que marcar "Pagada" para producir (decisión de negocio).
- Más de un administrador / rol "operador" con permisos reales (el backend solo distingue `RolID === 1`).
- Guardar los comprobantes como archivo en vez de base64 en la base.
- `USER node` en el backend: diferido por el bind mount de `uploads` (riesgo de permisos en Linux).
- Pedidos sin método de pago: resuelto en la rama `correcciones-validacion` (usan `PLAZO_PAGO_HORAS`); falta confirmar que el negocio quiere ese mismo plazo.
- Purgar historial de git de los 32 diseños de `backend/uploads/disenos`: no hacer sin petición expresa.

## Línea base de pruebas (2026-11-26, rama `ola-a-dinero-sesion`)
jest 356/356 · vitest 66/66 · lint y build en verde · integración 11/11 · E2E 8/8 (218 comprobaciones; `vacios.js` contra una instancia sin datos) · MariaDB 12.3 desechable. CSP verificada con Puppeteer.

## Línea base anterior (2026-11-13, rama `correcciones-validacion`)
jest 214/214 · vitest 55/55 · lint y build en verde · integración 11/11 · E2E 7/7 recorridos (Docker). Antes (2026-11-04): jest 193 · vitest 49.
