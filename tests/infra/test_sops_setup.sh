#!/usr/bin/env bash
# Test du scaffolding SOPS + age (STN-30).
# Valide les livrables versionnés dans le repo :
#   CA1 — guide d'installation présent (docs/cyber/sops-setup.md)
#   CA2 — script helper de génération de clé présent et exécutable (scripts/cyber/generate-age-key.sh)
#   CA3 — .sops.yaml présent avec creation_rules par environnement
# Les installations locales (sops, age) et les clés équipe sont hors scope de ce test (actions humaines).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }

FAIL=0

# CA1 — guide install
DOC="${ROOT_DIR}/docs/cyber/sops-setup.md"
if [[ -f "${DOC}" ]]; then
    grep -qiE "scoop|choco|winget" "${DOC}" && grep -qiE "brew" "${DOC}" && grep -qiE "apt|snap" "${DOC}" \
        && green "  [OK] CA1 — guide install cross-OS présent" \
        || { red "  [FAIL] CA1 — guide présent mais ne couvre pas Windows + macOS + Linux"; FAIL=1; }
else
    red "  [FAIL] CA1 — ${DOC} manquant"; FAIL=1
fi

# CA2 — script keygen
SCRIPT="${ROOT_DIR}/scripts/cyber/generate-age-key.sh"
if [[ -f "${SCRIPT}" ]] && [[ -x "${SCRIPT}" ]]; then
    # le script doit au moins vérifier la présence d'age et créer le dossier ~/.sops/age
    grep -q "age-keygen" "${SCRIPT}" && grep -qE '~/\.sops/age|HOME.*\.sops/age' "${SCRIPT}" \
        && green "  [OK] CA2 — script keygen exécutable et cohérent" \
        || { red "  [FAIL] CA2 — script présent mais n'invoque pas age-keygen vers ~/.sops/age/"; FAIL=1; }
else
    red "  [FAIL] CA2 — ${SCRIPT} manquant ou non exécutable"; FAIL=1
fi

# CA3 — .sops.yaml avec creation_rules par env
SOPS_YAML="${ROOT_DIR}/.sops.yaml"
if [[ -f "${SOPS_YAML}" ]]; then
    PYTHONIOENCODING=utf-8 uv run python - "${SOPS_YAML}" <<'PY' || { FAIL=1; }
import sys, re
content = open(sys.argv[1], encoding="utf-8").read()
if "creation_rules" not in content:
    print("  [FAIL] CA3 — .sops.yaml n'a pas de creation_rules"); sys.exit(1)
required_envs = ["dev", "test", "preview", "prod"]
missing = [env for env in required_envs if not re.search(rf"path_regex:.*{env}.*sops", content)]
if missing:
    print(f"  [FAIL] CA3 — creation_rules ne couvre pas les envs : {missing}"); sys.exit(1)
print("  [OK] CA3 — .sops.yaml couvre les 4 envs (creation_rules présentes)")
PY
else
    red "  [FAIL] CA3 — ${SOPS_YAML} manquant"; FAIL=1
fi

[[ "${FAIL}" -ne 0 ]] && { red "ÉCHEC"; exit 1; }
green "OK — scaffolding SOPS conforme"
