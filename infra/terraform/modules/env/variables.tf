variable "env_name" {
  type        = string
  description = "Nom de l'environnement (dev, test, preview, prod). Utilisé comme préfixe des ressources Docker."

  validation {
    condition     = can(regex("^[a-z0-9-]{1,20}$", var.env_name))
    error_message = "env_name doit contenir uniquement [a-z0-9-] et faire 1 à 20 caractères."
  }
}
