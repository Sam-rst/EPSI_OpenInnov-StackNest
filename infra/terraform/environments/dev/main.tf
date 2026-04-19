variable "env_name" {
  type        = string
  description = "Nom de l'environnement (doit correspondre au dossier courant)."

  validation {
    condition     = var.env_name == "dev"
    error_message = "env_name doit valoir \"dev\" (dossier environments/dev). Vérifie que tu utilises le bon -var-file."
  }
}

module "env" {
  source   = "../../modules/env"
  env_name = var.env_name
}

output "network_name" {
  value = module.env.network_name
}

output "db_volume_name" {
  value = module.env.db_volume_name
}

output "redis_volume_name" {
  value = module.env.redis_volume_name
}
