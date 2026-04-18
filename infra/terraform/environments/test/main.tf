variable "env_name" {
  type        = string
  description = "Nom de l'environnement (dev, test, preview, prod)."
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
