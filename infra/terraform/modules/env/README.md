# Module Terraform `env`

Module générique qui provisionne les ressources partagées d'un environnement StackNest :

- 1 réseau Docker (`bridge`) nommé `stacknest-<env_name>`
- 1 volume Docker pour la BDD nommé `stacknest-<env_name>-db`
- 1 volume Docker pour Redis nommé `stacknest-<env_name>-redis`

Toutes les ressources portent les labels standards : `project=stacknest`, `env=<env_name>`, `managed_by=terraform`.

## Usage

```hcl
module "env" {
  source   = "../../modules/env"
  env_name = "dev"
}

# Réutilisable en aval
resource "docker_container" "api" {
  networks_advanced { name = module.env.network_name }
  volumes {
    volume_name    = module.env.db_volume_name
    container_path = "/var/lib/postgresql/data"
  }
}
```

## Variables

| Nom | Type | Description | Validation |
|---|---|---|---|
| `env_name` | `string` | Nom de l'environnement | `^[a-z0-9-]{1,20}$` |

## Outputs

| Nom | Description |
|---|---|
| `network_name` | Nom du réseau Docker |
| `db_volume_name` | Nom du volume BDD |
| `redis_volume_name` | Nom du volume Redis |

## Tests

```bash
bash tests/infra/test_module_env.sh
```

Valide via `terraform plan -json` que les ressources, labels et outputs correspondent aux CA de STN-27. Pas de Docker démarré requis (plan uniquement).
