# project-state.md — STAMPLAB_UNIFICADO

**Qué es:** tienda + panel administrativo para estampados (monorepo backend/frontend/e2e).
**Modo:** Velonet (octopus-agents) · autonomía semiautomática · criticidad **alta** (ventas, pagos, datos personales de clientes).
**Diseño:** tokens propios del proyecto en `frontend/src/config/tokens.js`.

## Fase actual
Mejoras derivadas de la auditoría del 2026-11-04, en la rama `mejoras-auditoria`. Plan por olas:
1. **Ola 1 (sin cambio de comportamiento):** en curso. Hecho: audit fix de joi, dockerignore, USER node en frontend, quitar Tailwind, import dinámico de jspdf/html2canvas, `config/api.js` unificado, `PUBLIC_URL`, renombres `*Form.jsx`, docs, CI.
2. **Ola 2:** `ADMIN_PASSWORD` sin default en compose, límite JSON 100 kb, puerto 3306 a 127.0.0.1, correcciones del dashboard.
3. **Ola 3:** integridad (bloqueos en compras, atomicidad al aprobar cotización, índices, vencimiento de pedidos sin método de pago, índice único en inventario).
4. **Ola 4:** refactor de componentes/controladores grandes (requiere autorización aparte).

## Decisiones pendientes
- `USER node` en el backend: diferido por el bind mount de `uploads` (riesgo de permisos en Linux).
- Plazo de vencimiento para pedidos sin método de pago (Ola 3).
- Purgar historial de git de los 32 diseños de `backend/uploads/disenos`: no hacer sin petición expresa.

## Línea base de pruebas (2026-11-04)
jest 193/193 · vitest 49/49 · lint y build en verde.
