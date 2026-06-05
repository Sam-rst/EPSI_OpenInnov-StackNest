import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useSidebarToggle } from './useSidebarToggle'

/**
 * Shell applicatif : Sidebar pleine hauteur à gauche + colonne de contenu
 * (TopBar puis zone main scrollable) à droite. Utilisé pour toutes les routes
 * applicatives. La Sidebar passe en drawer sous 768px, commandé par le burger
 * de la TopBar. L'Outlet est isolé dans une ErrorBoundary + Suspense pour ne
 * pas casser la navigation en cas d'erreur ou de chargement async.
 *
 * Le drawer se ferme automatiquement :
 *   - sur changement de route (UX mobile : cliquer un lien referme le menu)
 *   - sur touche Escape (pattern WAI-ARIA modal dialog)
 */
export function AppLayout() {
  const { isOpen, toggle, close } = useSidebarToggle()
  const location = useLocation()

  // Ferme au changement de route uniquement. Appel de close() sans garde
  // `if (isOpen)` volontaire : ajouter isOpen aux deps ferait re-declencher
  // cet effet a chaque toggle, annulant l'ouverture. setIsOpen(false) est
  // un no-op par bail-out React quand isOpen est deja false.
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
    globalThis.addEventListener('keydown', handleKey)
    return () => {
      globalThis.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, close])

  return (
    <div className="bg-surface text-text-primary flex min-h-0 flex-1 overflow-hidden">
      <Sidebar isOpen={isOpen} onDismiss={close} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={toggle} menuExpanded={isOpen} />
        <main role="main" className="flex-1 overflow-y-auto px-6 py-8">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div
                  role="status"
                  aria-busy="true"
                  aria-live="polite"
                  className="bg-surface-sunken h-32 animate-pulse rounded-md"
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
