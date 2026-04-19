# Terraform — StackNest IaC

Workspace Terraform pour le provisioning des environnements StackNest via le provider Docker (MVP).

## Prérequis

- Terraform ≥ 1.6
- Docker Desktop (ou daemon Docker accessible via socket)
- Sur Windows : WSL2 recommandé pour exécuter Terraform

## Structure

```
infra/terraform/
├── environments/
│   ├── dev/      # Environnement de développement  (dev.tfvars)
│   ├── test/     # Environnement de pentest         (test.tfvars)
│   ├── preview/  # Environnement de recette / QA   (preview.tfvars)
│   └── prod/     # Environnement de production     (prod.tfvars)
└── modules/
    └── env/      # Module générique : network + volumes db/redis
```

Un seul environnement est actif à la fois sur le serveur cible (Antony).

## Usage

Pour chaque environnement (remplacer `<env>` par `dev`, `test`, `preview` ou `prod`) :

```bash
cd infra/terraform/environments/<env>
terraform init
terraform validate
terraform plan  -var-file=<env>.tfvars
terraform apply -var-file=<env>.tfvars
```

### Destroy

Les volumes (`db`, `redis`) ont `lifecycle { prevent_destroy = true }` — un `terraform destroy` échouera.

Pour désactiver un environnement non-prod sans perdre les données :

```bash
terraform destroy -var-file=<env>.tfvars -target=module.env.docker_network.this
```

Pour supprimer complètement les volumes (⚠️ perte de données) :

```bash
terraform state rm module.env.docker_volume.db module.env.docker_volume.redis
terraform destroy -var-file=<env>.tfvars
```

**NE JAMAIS faire ça sur prod sans backup préalable.**

## Backend state

Backend local (`.terraform/`) pour le MVP. Migration vers un backend remote (S3/Azure Blob) prévue en v0.2+.

Le fichier `.terraform.lock.hcl` est versionné pour garantir la reproductibilité des providers.

## Tests

```bash
bash tests/infra/test_terraform_workspace.sh      # fmt + init + validate sur 4 envs
bash tests/infra/test_module_env.sh               # module env : ressources + labels + outputs
bash tests/infra/test_envs_instantiation.sh       # plan par env + prevent_destroy
```
