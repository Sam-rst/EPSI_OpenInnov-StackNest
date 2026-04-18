#!/usr/bin/env bash
# Test d'intégration du workspace Terraform StackNest (STN-26).
# Vérifie que chaque environnement (dev/test/preview/prod) :
#   - passe `terraform fmt -check`
#   - passe `terraform init -backend=false`
#   - passe `terraform validate`
# Et que l'env `dev` retourne un plan vide ("No changes").

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TF_DIR="${ROOT_DIR}/infra/terraform"
ENVS=(dev test preview prod)
FAIL=0

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }

if command -v terraform >/dev/null 2>&1; then
    TF=terraform
elif command -v terraform.exe >/dev/null 2>&1; then
    TF=terraform.exe
else
    red "terraform CLI introuvable (ni 'terraform' ni 'terraform.exe' dans le PATH)"
    red "→ Installez Terraform >= 1.6 ou ajoutez-le au PATH du shell courant"
    exit 1
fi
[[ -d "${TF_DIR}" ]] || { red "Dossier manquant : ${TF_DIR}"; exit 1; }
[[ -d "${TF_DIR}/modules" ]] || { red "Dossier manquant : ${TF_DIR}/modules"; exit 1; }

for env in "${ENVS[@]}"; do
    env_dir="${TF_DIR}/environments/${env}"
    echo "=== ${env} ==="
    if [[ ! -d "${env_dir}" ]]; then
        red "  ✗ dossier manquant : ${env_dir}"; FAIL=1; continue
    fi
    (cd "${env_dir}" && "${TF}" fmt -check -recursive >/dev/null) \
        && green "  ✓ fmt" || { red "  ✗ fmt"; FAIL=1; }
    (cd "${env_dir}" && "${TF}" init -backend=false -input=false -no-color >/dev/null) \
        && green "  ✓ init" || { red "  ✗ init"; FAIL=1; }
    (cd "${env_dir}" && "${TF}" validate -no-color >/dev/null) \
        && green "  ✓ validate" || { red "  ✗ validate"; FAIL=1; }
done

dev_dir="${TF_DIR}/environments/dev"
echo "=== plan dev (attendu: No changes) ==="
if (cd "${dev_dir}" && "${TF}" plan -input=false -no-color 2>&1 | grep -qE "No changes|Your infrastructure matches"); then
    green "  ✓ plan vide"
else
    red "  ✗ plan non vide"; FAIL=1
fi

if [[ "${FAIL}" -ne 0 ]]; then red "ÉCHEC"; exit 1; fi
green "OK — workspace Terraform conforme"
