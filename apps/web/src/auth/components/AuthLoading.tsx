/** Écran d'attente affiché pendant la reconnexion silencieuse au démarrage. */
export function AuthLoading() {
  return (
    <div
      role="status"
      className="text-text-secondary flex flex-1 items-center justify-center p-8 text-sm"
    >
      Vérification de la session…
    </div>
  )
}
