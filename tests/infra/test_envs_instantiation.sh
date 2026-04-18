#!/usr/bin/env bash
# Test d'intégration de l'instanciation des 4 environnements (STN-28).
# Valide pour chaque env (dev/test/preview/prod) :
#   CA1 — terraform plan avec <env>.tfvars réussit et crée les ressources préfixées stacknest-<env>-*
#   CA2 — les 4 envs produisent des ressources isolées (préfixes distincts)
#   CA3 — le module `env` a `lifecycle { prevent_destroy = true }` sur les volumes

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TF_DIR="${ROOT_DIR}/infra/terraform"
ENVS=(dev test preview prod)

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }

if command -v terraform >/dev/null 2>&1; then TF=terraform
elif command -v terraform.exe >/dev/null 2>&1; then TF=terraform.exe
else red "terraform CLI introuvable"; exit 1
fi

# CA3 — prevent_destroy statique dans le module
MODULE_MAIN="${TF_DIR}/modules/env/main.tf"
if ! grep -q "prevent_destroy *= *true" "${MODULE_MAIN}"; then
    red "CA3: prevent_destroy = true absent de ${MODULE_MAIN}"
    exit 1
fi
green "  [OK] CA3 — prevent_destroy présent dans le module"

# CA1 + CA2 — plan sur chaque env avec son tfvars
FAIL=0
for env in "${ENVS[@]}"; do
    env_dir="${TF_DIR}/environments/${env}"
    tfvars="${env_dir}/${env}.tfvars"
    echo "=== ${env} ==="
    [[ -f "${env_dir}/main.tf" ]] || { red "  [FAIL] ${env_dir}/main.tf manquant"; FAIL=1; continue; }
    [[ -f "${tfvars}" ]] || { red "  [FAIL] ${tfvars} manquant"; FAIL=1; continue; }

    (cd "${env_dir}" && rm -rf .terraform plan.bin plan.json && "${TF}" init -backend=false -input=false -no-color >/dev/null) \
        || { red "  [FAIL] init"; FAIL=1; continue; }
    (cd "${env_dir}" && "${TF}" plan -var-file="${env}.tfvars" -out=plan.bin -input=false -no-color >/dev/null) \
        || { red "  [FAIL] plan"; FAIL=1; continue; }
    (cd "${env_dir}" && "${TF}" show -json plan.bin >plan.json)

    PYTHONIOENCODING=utf-8 uv run python - "${env_dir}/plan.json" "${env}" <<'PY'
import json, sys
plan_path, env = sys.argv[1], sys.argv[2]
with open(plan_path, encoding="utf-8") as f:
    plan = json.load(f)

module_resources = []
for child in plan.get("planned_values", {}).get("root_module", {}).get("child_modules", []):
    module_resources.extend(child.get("resources", []))

expected = {
    ("docker_network", f"stacknest-{env}"),
    ("docker_volume", f"stacknest-{env}-db"),
    ("docker_volume", f"stacknest-{env}-redis"),
}
actual = {(r.get("type"), r.get("values", {}).get("name")) for r in module_resources}
missing = expected - actual
if missing:
    print(f"  [FAIL] {env}: ressources manquantes: {missing}")
    sys.exit(1)

for r in module_resources:
    labels = {lbl.get("label"): lbl.get("value") for lbl in r.get("values", {}).get("labels", []) or []}
    if labels.get("env") != env:
        print(f"  [FAIL] {env}: label env={labels.get('env')} != {env}")
        sys.exit(1)

print(f"  [OK] {env} — 3 ressources avec préfixe stacknest-{env}-*")
PY
    PY_EXIT=$?
    [[ "${PY_EXIT}" -ne 0 ]] && FAIL=1
    rm -f "${env_dir}/plan.bin" "${env_dir}/plan.json"
done

[[ "${FAIL}" -ne 0 ]] && { red "ÉCHEC"; exit 1; }
green "OK — 4 environnements instanciés correctement"
