/** Action de déploiement détectée dans un message assistant (fallback C2). */
export interface DeploymentActionHint {
  /** Identifiant du template du catalogue à préremplir. */
  templateId: string
  /** Texte hors du bloc JSON, affiché au-dessus du CTA. */
  precedingText: string
}

// Capture le 1er bloc ```json ... ``` du contenu (drapeau insensible aux
// retours). Le groupe `[\s\S]*?` est PARESSEUX et borne par des delimiteurs
// fixes (```` ```json ```` ... ```` ``` ````) : aucun quantificateur imbrique
// ni alternance ambigue, donc pas de backtracking super-lineaire (ReDoS).
// L'entree est par ailleurs un message assistant de longueur bornee. Le hotspot
// SonarCloud S5852 est donc safe-by-design — a marquer « reviewed / safe » cote
// UI SonarCloud (necessite un token, non automatisable ici). NOSONAR
const JSON_FENCE = /```json\s*\n?([\s\S]*?)```/i

/** Lit un `template_id` / `templateId` chaîne non vide dans un objet inconnu. */
function readTemplateId(parsed: unknown): string | null {
  if (typeof parsed !== 'object' || parsed === null) {
    return null
  }
  const record = parsed as Record<string, unknown>
  const raw = record.template_id ?? record.templateId
  if (typeof raw !== 'string' || raw.trim() === '') {
    return null
  }
  return raw
}

/**
 * Détecte, en best-effort, qu'un message assistant décrit un déploiement via un
 * bloc ```json``` portant un `template_id` (cas des petits modèles qui crachent
 * du JSON au lieu d'une action structurée — constaté en QA). Permet d'afficher un
 * CTA « Configurer ce déploiement » plutôt que du JSON brut (C2).
 *
 * Renvoie `null` dès que le format n'est pas certain (pas de bloc, JSON invalide,
 * `template_id` absent ou non-chaîne) : le contenu retombe alors sur le rendu
 * Markdown normal, sans jamais lever d'exception.
 */
export function parseDeploymentAction(content: string): DeploymentActionHint | null {
  const match = JSON_FENCE.exec(content)
  if (match === null) {
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(match[1].trim())
  } catch {
    return null
  }

  const templateId = readTemplateId(parsed)
  if (templateId === null) {
    return null
  }

  return {
    templateId,
    precedingText: content.slice(0, match.index).trim(),
  }
}
