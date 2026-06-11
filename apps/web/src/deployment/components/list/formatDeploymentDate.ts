/**
 * Formate une date ISO 8601 pour la liste des déploiements (locale fr-FR).
 * Retombe sur « — » si absente et sur la valeur brute si non parsable.
 */
export function formatDeploymentDate(iso: string | null): string {
  if (iso === null) {
    return '—'
  }
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('fr-FR')
}
