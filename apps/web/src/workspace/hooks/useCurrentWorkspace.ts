import { CURRENT_WORKSPACE_FIXTURE } from '../data/workspace.fixtures'
import type { Workspace } from '../domain/models/Workspace'

/**
 * Fournit l'espace de travail courant consommé par le shell (Sidebar).
 *
 * Vague 1 (rendu) : renvoie une fixture (espace de démo « StackNest Lab »).
 * Vague 2 (multi-workspace) : lira l'espace actif depuis l'API / le contexte
 *   utilisateur sans changer la signature — la Sidebar reste inchangée.
 */
export function useCurrentWorkspace(): Workspace {
  return CURRENT_WORKSPACE_FIXTURE
}
