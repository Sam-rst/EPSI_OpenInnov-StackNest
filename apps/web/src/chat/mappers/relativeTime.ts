/** Seuils (en secondes) des paliers de libellé relatif français. */
const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * Libellé relatif français d'un instant passé par rapport à maintenant
 * (« à l'instant », « il y a 30 min », « il y a 2 h », « il y a 3 j »).
 * Pré-calculé côté mapper pour que la sidebar n'ait aucune logique de date.
 */
export function relativeFromNow(iso: string): string {
  const elapsedSeconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)

  if (elapsedSeconds < MINUTE) {
    return "à l'instant"
  }
  if (elapsedSeconds < HOUR) {
    return `il y a ${Math.floor(elapsedSeconds / MINUTE)} min`
  }
  if (elapsedSeconds < DAY) {
    return `il y a ${Math.floor(elapsedSeconds / HOUR)} h`
  }
  return `il y a ${Math.floor(elapsedSeconds / DAY)} j`
}
