/**
 * Source de vérité des routes — toujours typer les params.
 * Préférer ROUTES.app.resource(id) à un template literal en dur.
 */
export const ROUTES = {
  public: {
    landing: '/',
    login: '/login',
  },
  app: {
    catalog: '/app/catalog',
    config: '/app/config',
    deploy: '/app/deploy',
    deployment: (runId: string) => `/app/deploy/${runId}`,
    dashboard: '/app/dashboard',
    chat: '/app/chat',
    admin: '/app/admin',
    settings: '/app/settings',
  },
} as const;
