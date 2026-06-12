interface StackServiceParamsProps {
  /** Params de provisioning du service (valeurs secrètes déjà masquées par l'API). */
  params: Record<string, unknown>
}

/**
 * Affiche les paramètres de provisioning **non sensibles** d'un service. Les
 * params de type `secret` arrivent déjà masqués de l'API (`••••••••`) : on les
 * rend tels quels sans jamais reconstruire de valeur en clair.
 */
export function StackServiceParams({ params }: StackServiceParamsProps) {
  const entries = Object.entries(params)

  if (entries.length === 0) {
    return <p className="text-text-muted text-[13px]">Aucun paramètre.</p>
  }

  return (
    <dl className="space-y-1.5">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 text-[12.5px]">
          <dt className="text-text-secondary font-mono">{key}</dt>
          <span className="text-text-muted">=</span>
          <dd className="text-text-primary font-mono">{String(value)}</dd>
        </div>
      ))}
    </dl>
  )
}
