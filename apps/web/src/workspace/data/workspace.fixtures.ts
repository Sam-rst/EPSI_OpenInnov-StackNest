import type { Workspace } from '../domain/models/Workspace'

/**
 * Espace neutre servi tant que le multi-workspace n'est pas branché (Vague 2).
 * On affiche le nom du produit (« StackNest »), pas un workspace fictif, et un
 * plan neutre (« local ») au lieu d'une facturation inventée. Le vrai espace
 * actif remplacera ces valeurs sans changer la signature.
 */
export const CURRENT_WORKSPACE_FIXTURE: Workspace = {
  id: 'ws_local',
  name: 'StackNest',
  plan: 'local',
  initials: 'SN',
}
