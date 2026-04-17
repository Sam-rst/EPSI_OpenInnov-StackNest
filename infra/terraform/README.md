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
│   ├── dev/      # Environnement de développement
│   ├── test/     # Environnement de pentest (cyber team)
│   ├── preview/  # Environnement de recette (QA)
│   └── prod/     # Environnement de production
└── modules/      # Modules réutilisables (vide — cf. STN-27+)
```

Un seul environnement est actif à la fois sur le serveur cible (Antony).

## Usage

```bash
cd infra/terraform/environments/<env>
terraform init
terraform validate
terraform plan
terraform apply
```

## Backend state

Backend local (`.terraform/`) pour le MVP. Migration vers un backend remote (S3/Azure Blob) prévue en v0.2+.

Le fichier `.terraform.lock.hcl` est versionné pour garantir la reproductibilité des providers.

## Tests

```bash
bash tests/infra/test_terraform_workspace.sh
```

Valide `fmt`, `init`, `validate` sur les 4 environnements et `plan` vide sur `dev`.
