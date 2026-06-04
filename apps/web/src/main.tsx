import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts self-hostées (offline-friendly, pas de dépendance Google Fonts runtime).
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import App from './App.tsx'
import { initSentry } from './core/sentry'
import './index.css'

initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT,
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Element #root introuvable dans index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
