#!/usr/bin/env bash
# Scan les *.tfvars commités sous infra/terraform/environments/ pour détecter tout
# pattern sensible (secret, token, credential). Les secrets doivent passer par SOPS (STN-31)
# et jamais être commités en clair dans les tfvars.
#
# Appelé en CI (STN-12) ET en pre-commit hook (ticket futur husky/lint-staged).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_DIR="${ROOT_DIR}/infra/terraform/environments"

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }

# Patterns sensibles : nom de variable commun à une fuite de secret.
# Insensible à la casse. Liste évolutive — ajouter les patterns métier rencontrés.
SENSITIVE_PATTERNS=(
    '(?i)^\s*\w*_?(password|passwd|pwd)\s*='
    '(?i)^\s*\w*_?(secret|token|api[_-]?key|apikey)\s*='
    '(?i)^\s*\w*_?(private[_-]?key)\s*='
    '(?i)^\s*(aws|gcp|azure)_\w*(access|secret)\s*='
    '(?i)^\s*(db|database)_\w*(password|url)\s*='
)

FAIL=0
SCANNED=0

if [[ ! -d "${ENV_DIR}" ]]; then
    red "Dossier manquant : ${ENV_DIR}"
    exit 1
fi

while IFS= read -r -d '' file; do
    SCANNED=$((SCANNED + 1))
    for pattern in "${SENSITIVE_PATTERNS[@]}"; do
        if grep -Pq "${pattern}" "${file}" 2>/dev/null; then
            red "  [FAIL] Pattern sensible détecté dans ${file} : ${pattern}"
            grep -PnH "${pattern}" "${file}" || true
            FAIL=1
        fi
    done
done < <(find "${ENV_DIR}" -name '*.tfvars' -type f -print0)

if [[ "${SCANNED}" -eq 0 ]]; then
    red "Aucun *.tfvars trouvé dans ${ENV_DIR}"
    exit 1
fi

if [[ "${FAIL}" -ne 0 ]]; then
    red "ÉCHEC — secrets potentiels dans les tfvars. Déplacer vers SOPS (STN-31)."
    exit 1
fi

green "OK — ${SCANNED} fichier(s) tfvars scanné(s), aucun pattern sensible détecté"
