interface SidebarProps {
  isOpen: boolean
  onDismiss: () => void
}

/**
 * Stub visuel de la Sidebar — les items de navigation reels arrivent dans un
 * ticket dedie. Ici on gere surtout la bascule desktop (toujours visible) /
 * mobile (drawer togglable, controle par TopBar burger).
 */
export function Sidebar({ isOpen, onDismiss }: SidebarProps) {
  return (
    <>
      {/* Overlay mobile derriere le drawer — desactive au-dela de 768px via md:hidden */}
      {isOpen && (
        <button
          type="button"
          aria-label="Fermer la navigation"
          onClick={onDismiss}
          className="fixed inset-0 top-14 z-30 bg-black/30 md:hidden"
        />
      )}
      <nav
        id="app-sidebar"
        role="navigation"
        aria-label="Navigation principale"
        data-open={isOpen}
        className="bg-night/5 border-night/10 fixed top-14 bottom-0 left-0 z-40 w-60 -translate-x-full border-r transition-transform duration-200 ease-out data-[open=true]:translate-x-0 md:static md:top-0 md:translate-x-0"
      >
        <ul className="flex flex-col gap-1 p-4 text-sm">
          <li>
            <a href="/" className="hover:bg-night/10 block rounded-md px-3 py-2 font-medium">
              Accueil
            </a>
          </li>
        </ul>
      </nav>
    </>
  )
}
