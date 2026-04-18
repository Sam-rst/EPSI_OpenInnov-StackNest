terraform {
  required_version = ">= 1.6"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

module "env_under_test" {
  source   = "../../../../infra/terraform/modules/env"
  env_name = "stn27test"
}

output "network_name" {
  value = module.env_under_test.network_name
}

output "db_volume_name" {
  value = module.env_under_test.db_volume_name
}

output "redis_volume_name" {
  value = module.env_under_test.redis_volume_name
}
