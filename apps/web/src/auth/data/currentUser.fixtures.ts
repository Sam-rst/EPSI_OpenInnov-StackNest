import type { CurrentUser } from '../domain/models/CurrentUser'

/** Utilisateur de démo servi tant que le login n'est pas branché (Vague 2). */
export const CURRENT_USER_FIXTURE: CurrentUser = {
  id: 'usr_demo',
  name: 'John Doe',
  role: 'Owner · Admin · Plateforme',
}
