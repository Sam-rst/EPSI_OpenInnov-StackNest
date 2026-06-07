interface AuthFormErrorProps {
  /** Message à afficher, ou null/undefined pour ne rien rendre. */
  message?: string | null
}

/** Bannière d'erreur de formulaire (niveau global, ex. identifiants invalides). */
export function AuthFormError({ message }: AuthFormErrorProps) {
  if (!message) {
    return null
  }

  return (
    <p
      role="alert"
      className="border-error/30 bg-error/10 text-error rounded-md border px-3 py-2 text-[13px]"
    >
      {message}
    </p>
  )
}
