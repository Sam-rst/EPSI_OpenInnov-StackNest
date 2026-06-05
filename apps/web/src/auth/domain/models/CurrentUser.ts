/** Utilisateur authentifié affiché dans le shell (bloc utilisateur de la TopBar). */
export interface CurrentUser {
  id: string
  name: string
  /** Rôle/affiliation affiché sous le nom (ex. « Owner · Admin · Plateforme »). */
  role: string
}
