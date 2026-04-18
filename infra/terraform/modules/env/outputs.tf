output "network_name" {
  value       = docker_network.this.name
  description = "Nom du réseau Docker de l'environnement."
}

output "db_volume_name" {
  value       = docker_volume.db.name
  description = "Nom du volume Docker de la base de données."
}

output "redis_volume_name" {
  value       = docker_volume.redis.name
  description = "Nom du volume Docker de Redis."
}
