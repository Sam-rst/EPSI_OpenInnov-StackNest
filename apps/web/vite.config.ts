import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cible du reverse-proxy dev pour les appels /api/*.
// En npm run dev local : l'API tourne sur localhost:8000.
// En docker compose dev : l'API tourne dans le reseau compose a api:8000.
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8000'

// Mode polling : active dans les containers ou les bind-mounts cross-OS
// (Windows/macOS -> Linux) cassent la propagation inotify, ce qui empeche
// Vite de detecter les changements sous src/ et donc de declencher le HMR.
// Ne pas activer en local natif : polling coute plus de CPU qu'inotify.
const usePolling = process.env.VITE_USE_POLLING === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    watch: usePolling ? { usePolling: true, interval: 300 } : undefined,
  },
})
