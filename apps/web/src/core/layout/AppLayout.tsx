import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useSidebarToggle } from './useSidebarToggle'

/**
 * Shell qui assemble TopBar + Sidebar + zone main + Outlet. Utilise pour
 * toutes les routes applicatives. La Sidebar passe en drawer sous 768px,
 * commande par le burger de la TopBar. L'Outlet est isole dans une
 * ErrorBoundary + Suspense pour ne pas casser la navigation en cas d'erreur
 * ou de chargement async.
 *
 * Le drawer se ferme automatiquement :
 *   - sur changement de route (UX mobile : cliquer un lien referme le menu)
 *   - sur touche Escape (pattern WAI-ARIA modal dialog)
 */
export function AppLayout() {
  const { isOpen, toggle, close } = useSidebarToggle()
  const location = useLocation()

  useEffect(() => {
    close()
  }, [location.pathname, close])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        close()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, close])

  return (
    <div className="text-night flex min-h-screen flex-col bg-white">
      <TopBar onMenuClick={toggle} menuExpanded={isOpen} />
      <div className="flex flex-1">
        <Sidebar isOpen={isOpen} onDismiss={close} />
        <main role="main" className="flex-1 px-6 py-8">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div
                  role="status"
                  aria-busy="true"
                  aria-live="polite"
                  className="bg-night/10 h-32 animate-pulse rounded-md"
                />
              }
            >
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
