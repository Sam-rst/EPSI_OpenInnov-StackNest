const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

/**
 * Formate une date ISO en libellé relatif court et humain pour l'horodatage des
 * messages (F3) : « à l'instant » (< 1 min), « il y a N min » (< 1 h), « il y a
 * N h » (< 1 j), puis l'heure locale `HH:MM` au-delà. Renvoie une chaîne vide
 * si la date est invalide (filet de sécurité, jamais de « NaN » affiché).
 *
 * @param iso  date d'envoi du message (ISO 8601)
 * @param now  instant de référence (injectable pour les tests)
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const elapsedMs = now.getTime() - date.getTime()

  if (elapsedMs < MINUTE_MS) {
    return 'à l’instant'
  }
  if (elapsedMs < HOUR_MS) {
    return `il y a ${Math.floor(elapsedMs / MINUTE_MS)} min`
  }
  if (elapsedMs < DAY_MS) {
    return `il y a ${Math.floor(elapsedMs / HOUR_MS)} h`
  }
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
