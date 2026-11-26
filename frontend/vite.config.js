import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Código que solo usa el panel administrativo (páginas, layout, menú lateral) o que se carga muy de vez en cuando
// (exportar PDF del panel: jspdf, html2canvas y sus dependencias). Va a assets/panel/ para que el service worker
// no lo descargue en la instalación: se guarda en caché la primera vez que se visita (ver runtimeCaching).
// Rollup agrupa en un chunk solo módulos que cargan las mismas rutas: si contiene un módulo del panel, todo el chunk es del panel.
const DEL_PANEL = /[\\/]src[\\/](pages|components[\\/](layouts|dashboard))[\\/]/
const PESADOS_OCASIONALES = /[\\/]node_modules[\\/](jspdf|html2canvas|canvg|dompurify)[\\/]/
const esModuloDelPanel = (id) => PESADOS_OCASIONALES.test(id) || (DEL_PANEL.test(id) && !/NoEncontrada/.test(id))
const esChunkDelPanel = (chunk) => !chunk.isEntry && chunk.moduleIds.some(esModuloDelPanel)

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: (chunk) => esChunkDelPanel(chunk) ? 'assets/panel/[name]-[hash].js' : 'assets/[name]-[hash].js',
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'StampLab',
        short_name: 'StampLab',
        description: 'Sistema de gestión StampLab',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#126baf',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Solo se precachea el "shell" de la app; las llamadas a la API nunca se cachean
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        // Lo del panel y lo pesado de uso ocasional no se precarga; se sirve con runtimeCaching (abajo)
        globIgnores: ['**/assets/panel/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // JS con hash en el nombre (inmutable): lo que no está precargado se guarda al visitarlo y sigue funcionando sin conexión
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/assets/') && url.pathname.endsWith('.js'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'stamplab-js',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [200] },
              plugins: [
                {
                  // Tras un despliegue, un chunk viejo puede no existir y el hosting responder index.html con 200:
                  // solo se guarda si de verdad es JavaScript, para no servir HTML como chunk durante 60 días.
                  cacheWillUpdate: async ({ response }) =>
                    response && (response.headers.get('content-type') || '').includes('javascript') ? response : null,
                },
              ],
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    env: { VITE_API_URL: 'http://api.test' },
  },
})
