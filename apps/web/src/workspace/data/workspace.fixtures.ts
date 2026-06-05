import type { Workspace } from '../domain/models/Workspace'

/** Espace de démo servi tant que le multi-workspace n'est pas branché (Vague 2). */
export const CURRENT_WORKSPACE_FIXTURE: Workspace = {
  id: 'ws_lab',
  name: 'StackNest Lab',
  plan: 'Team',
  initials: 'SN',
}
