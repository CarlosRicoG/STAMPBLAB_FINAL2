# STAMPLAB_UNIFICADO

Monorepo: tienda + panel administrativo para estampados. Ver `README.md` para la puesta en marcha.

## Comandos
- Backend (`backend/`): `npm run dev`, `npm test` (jest, sin base de datos), `npm run db:setup`, `npm run test:integracion` (necesita MySQL y API arriba).
- Frontend (`frontend/`): `npm run dev`, `npm run lint`, `npm test` (vitest), `npm run build`.
- E2E (`e2e/`): scripts Puppeteer; `npm test` corre `run.js`; el resto se invocan con `node <script>.js`.

## Convenciones
- Stack: Node 22, Express 5, Sequelize 6, MySQL; React 19 + Vite 7 + Bootstrap. Tailwind ya no se usa.
- URL del backend en el frontend: importar siempre `src/config/api.js`, nunca `import.meta.env.VITE_API_URL` directo.
- URL pública del backend en el servidor: `PUBLIC_URL` (no `API_URL`).
- Colores desde `frontend/src/config/tokens.js`.
- Reglas de negocio configurables por variables de entorno (ver `.env.example`).
- Trabajo en ramas; no commits directos a `main`.

## Antes de dar algo por terminado
Correr `npm test` en backend y frontend, `npm run lint` y `npm run build` en frontend. Si toca stock, ventas, pagos o cotizaciones, correr además `npm run test:integracion`.

## Estado y deuda conocida
Ver `project-state.md` y `docs/AUDITORIA.md`.
