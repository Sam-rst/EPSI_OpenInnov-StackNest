import type { DeploymentEvent } from '../types/models/DeploymentEvent'
import { DeploymentStatus } from '../types/enums/DeploymentStatus'

/**
 * Scénario d'EXEMPLE de progression d'un déploiement Docker (display-only).
 *
 * ⚠️ Logs, accès et mot de passe sont FICTIFS et explicitement marqués
 * « exemple ». Ils simulent ce que le flux SSE réel (`/deployments/{id}/events`)
 * émettra une fois branché. Le mot de passe d'exemple n'a aucune valeur réelle.
 *
 * Adapté à la réalité Docker (pas de Terraform) : validation → pull → création
 * conteneur → démarrage → prêt.
 */
export const EXAMPLE_DEPLOYMENT_EVENTS: readonly DeploymentEvent[] = [
  {
    at: '2026-06-07T09:12:00Z',
    status: DeploymentStatus.PROVISIONING,
    log: { time: '09:12:00', level: 'info', message: '[exemple] Validation de la configuration…' },
  },
  {
    at: '2026-06-07T09:12:01Z',
    log: { time: '09:12:01', level: 'ok', message: '[exemple] ✓ Configuration valide' },
  },
  {
    at: '2026-06-07T09:12:02Z',
    log: { time: '09:12:02', level: 'info', message: '[exemple] Pull de l’image postgres:16…' },
  },
  {
    at: '2026-06-07T09:12:08Z',
    log: { time: '09:12:08', level: 'ok', message: '[exemple] ✓ Image récupérée (218 Mo)' },
  },
  {
    at: '2026-06-07T09:12:09Z',
    log: { time: '09:12:09', level: 'info', message: '[exemple] Création du conteneur…' },
  },
  {
    at: '2026-06-07T09:12:11Z',
    log: { time: '09:12:11', level: 'ok', message: '[exemple] ✓ Conteneur créé' },
  },
  {
    at: '2026-06-07T09:12:12Z',
    log: { time: '09:12:12', level: 'info', message: '[exemple] Démarrage du conteneur…' },
  },
  {
    at: '2026-06-07T09:12:14Z',
    log: { time: '09:12:14', level: 'ok', message: '[exemple] ✓ Port publié sur l’hôte : 32769' },
  },
  {
    at: '2026-06-07T09:12:15Z',
    status: DeploymentStatus.RUNNING,
    log: { time: '09:12:15', level: 'ok', message: '[exemple] 🎉 Ressource prête' },
    access: {
      host: '10.0.0.5',
      port: 32769,
      user: 'stacknest_admin',
      // Mot de passe d'EXEMPLE, sans aucune valeur réelle (jamais re-récupérable).
      password: 'exemple-Mdp-A-Usage-Unique',
    },
  },
]
