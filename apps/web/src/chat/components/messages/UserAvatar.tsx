import { useCurrentUser } from '../../../auth/hooks/useCurrentUser'
import { Avatar } from '../../../shared/components/ui'

/**
 * Pastille d'initiales de l'utilisateur **courant réel** (via `useCurrentUser`,
 * comme la TopBar), aux tons jaune charte. Symétrique de `AssistantAvatar` ;
 * remplace l'ancien « Vous » codé en dur dont les initiales ne correspondaient
 * pas à l'utilisateur connecté.
 */
export function UserAvatar() {
  const user = useCurrentUser()
  return <Avatar name={user.name} color="#fea21f" size={32} />
}
