export type LogLevel = 'info' | 'ok' | 'err';

export interface LogLine {
  time: string;
  level: LogLevel;
  message: string;
}

export const DEPLOYMENT_LOGS: ReadonlyArray<LogLine> = [
  { time: '14:32:18', level: 'info', message: 'Initialisation du backend Terraform…' },
  { time: '14:32:19', level: 'info', message: 'Validation de la configuration HCL' },
  { time: '14:32:19', level: 'ok',   message: '✓ Configuration valide (12 ressources)' },
  { time: '14:32:20', level: 'info', message: "Calcul du plan d'exécution…" },
  { time: '14:32:21', level: 'info', message: 'Plan : 2 à créer, 0 à modifier, 0 à détruire' },
  { time: '14:32:22', level: 'ok',   message: "✓ Plan validé par l'utilisateur" },
  { time: '14:32:23', level: 'info', message: 'docker_volume.pg-prod-eu_data: Creating…' },
  { time: '14:32:24', level: 'ok',   message: '✓ docker_volume.pg-prod-eu_data: Creation complete (1.2s)' },
  { time: '14:32:25', level: 'info', message: 'docker_container.pg-prod-eu: Pulling postgres:16.4-alpine…' },
  { time: '14:32:31', level: 'info', message: 'Image téléchargée (218 MB)' },
  { time: '14:32:32', level: 'info', message: 'docker_container.pg-prod-eu: Creating…' },
  { time: '14:32:34', level: 'ok',   message: '✓ docker_container.pg-prod-eu: Creation complete (2.1s)' },
  { time: '14:32:35', level: 'info', message: 'Healthcheck en cours sur 172.18.0.4:5432…' },
  { time: '14:32:38', level: 'ok',   message: '✓ Healthcheck OK — pg-prod-eu accepte les connexions' },
  { time: '14:32:39', level: 'ok',   message: '🎉 Déploiement réussi en 21 secondes' },
];

export interface DeployStep {
  label: string;
  duration: number;
}

export const DEPLOY_STEPS: ReadonlyArray<DeployStep> = [
  { label: 'Validation',  duration: 1500 },
  { label: 'Plan',        duration: 2000 },
  { label: 'Apply',       duration: 8000 },
  { label: 'Healthcheck', duration: 2500 },
];
