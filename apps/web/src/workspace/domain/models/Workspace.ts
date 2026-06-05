/** Espace de travail courant affiché dans le sélecteur de la Sidebar. */
export interface Workspace {
  id: string
  name: string
  /** Plan de facturation affiché (ex. « Team »). */
  plan: string
  /** Initiales affichées dans la pastille (ex. « SN »). */
  initials: string
}
