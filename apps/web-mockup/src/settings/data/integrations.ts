export type IntegrationStatus = 'connected' | 'connect';

export interface Integration {
  name: string;
  icon: string;
  status: IntegrationStatus;
  desc: string;
}

export const INTEGRATIONS: ReadonlyArray<Integration> = [
  { name: 'GitHub',    icon: 'github',         status: 'connected', desc: 'Sync repos et PRs' },
  { name: 'GitLab',    icon: 'git-branch',     status: 'connected', desc: 'CI/CD pipelines' },
  { name: 'Slack',     icon: 'message-circle', status: 'connect',   desc: 'Notifications' },
  { name: 'Datadog',   icon: 'bar-chart-3',    status: 'connect',   desc: 'Monitoring & métriques' },
  { name: 'Vault',     icon: 'lock',           status: 'connected', desc: 'Gestion des secrets' },
  { name: 'PagerDuty', icon: 'bell',           status: 'connect',   desc: 'Alerting on-call' },
];
