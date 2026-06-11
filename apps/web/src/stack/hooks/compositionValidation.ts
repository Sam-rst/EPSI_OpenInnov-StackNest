import type { CompositionLink, CompositionService } from '../types/models/StackComposition'

/**
 * Alias compose valide : commence par une lettre minuscule, puis lettres /
 * chiffres / tirets (clé de service DNS-safe). Aligné sur l'esprit des noms de
 * service compose et des alias attendus côté back (lot 2).
 */
const ALIAS_PATTERN = /^[a-z][a-z0-9-]*$/

/** Résultat de validation d'une composition : drapeau + messages français. */
export interface CompositionValidationResult {
  valid: boolean
  errors: readonly string[]
}

/**
 * Détecte un cycle dans le graphe dirigé des liens (consommateur → fournisseur).
 * Parcours en profondeur avec pile de récursion : un sommet déjà dans la pile
 * courante signale un cycle. Une auto-boucle (`from === to`) est un cycle.
 */
export function hasCycle(links: readonly CompositionLink[]): boolean {
  const adjacency = buildAdjacency(links)
  const visited = new Set<string>()
  const inStack = new Set<string>()

  const explore = (node: string): boolean => {
    visited.add(node)
    inStack.add(node)
    for (const next of adjacency.get(node) ?? []) {
      if (inStack.has(next)) {
        return true
      }
      if (!visited.has(next) && explore(next)) {
        return true
      }
    }
    inStack.delete(node)
    return false
  }

  for (const node of adjacency.keys()) {
    if (!visited.has(node) && explore(node)) {
      return true
    }
  }
  return false
}

/** Construit la liste d'adjacence (from → [to...]) à partir des liens. */
function buildAdjacency(links: readonly CompositionLink[]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>()
  for (const link of links) {
    const targets = adjacency.get(link.fromLocalId) ?? []
    targets.push(link.toLocalId)
    adjacency.set(link.fromLocalId, targets)
  }
  return adjacency
}

/**
 * Valide une composition de stack avant déploiement (cf. design § Builder) :
 * au moins un service ; alias non vides, conformes et uniques ; aucun lien vers
 * soi-même ; graphe de dépendances acyclique. Renvoie tous les messages d'erreur
 * (français) pour un affichage groupé.
 */
export function validateComposition(
  services: readonly CompositionService[],
  links: readonly CompositionLink[],
): CompositionValidationResult {
  const errors: string[] = []

  if (services.length === 0) {
    errors.push('Ajoute au moins un service à la stack.')
  }

  errors.push(...aliasErrors(services))
  errors.push(...linkErrors(links))

  return { valid: errors.length === 0, errors }
}

/** Erreurs liées aux alias : vide, format invalide, doublons. */
function aliasErrors(services: readonly CompositionService[]): string[] {
  const errors: string[] = []
  const seen = new Set<string>()

  for (const service of services) {
    const alias = service.alias.trim()
    if (alias.length === 0) {
      errors.push('Chaque service doit avoir un alias non vide.')
      continue
    }
    if (!ALIAS_PATTERN.test(alias)) {
      errors.push(
        `L'alias « ${alias} » est invalide (minuscules, chiffres et tirets, commençant par une lettre).`,
      )
      continue
    }
    if (seen.has(alias)) {
      errors.push(`L'alias « ${alias} » doit être unique dans la stack.`)
    }
    seen.add(alias)
  }

  return errors
}

/** Erreurs liées aux liens : auto-lien, cycle. */
function linkErrors(links: readonly CompositionLink[]): string[] {
  const errors: string[] = []

  if (links.some((link) => link.fromLocalId === link.toLocalId)) {
    errors.push('Un service ne peut pas être lié à lui-même.')
  }
  if (hasCycle(links)) {
    errors.push('Les liens forment un cycle de dépendances : retire un lien.')
  }

  return errors
}
