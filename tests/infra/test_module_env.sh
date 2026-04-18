#!/usr/bin/env bash
# Test du module Terraform `env` (STN-27).
# Valide via `terraform plan -out` + `terraform show -json` :
#   CA1 : crée 1 docker_network + 2 docker_volume avec les noms préfixés `stacknest-<env_name>-*`
#   CA2 : toutes les ressources portent labels project=stacknest, env=<env_name>, managed_by=terraform
#   CA3 : outputs network_name, db_volume_name, redis_volume_name valides

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FIXTURE_DIR="${ROOT_DIR}/tests/infra/fixtures/module_env"
ENV_NAME="stn27test"

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }

if command -v terraform >/dev/null 2>&1; then
    TF=terraform
elif command -v terraform.exe >/dev/null 2>&1; then
    TF=terraform.exe
else
    red "terraform CLI introuvable"; exit 1
fi

[[ -d "${ROOT_DIR}/infra/terraform/modules/env" ]] || { red "Module manquant : infra/terraform/modules/env"; exit 1; }
[[ -f "${FIXTURE_DIR}/main.tf" ]] || { red "Fixture manquante : ${FIXTURE_DIR}/main.tf"; exit 1; }

cd "${FIXTURE_DIR}"
rm -rf .terraform plan.bin plan.json
"${TF}" init -backend=false -input=false -no-color >/dev/null
"${TF}" plan -out=plan.bin -input=false -no-color >/dev/null
"${TF}" show -json plan.bin >plan.json

uv run python - <<PY
import json, sys
with open("plan.json", encoding="utf-8") as f:
    plan = json.load(f)

env = "${ENV_NAME}"
failures = []

resources = {r["address"]: r for r in plan.get("planned_values", {}).get("root_module", {}).get("child_modules", [{}])[0].get("resources", [])}
expected = {
    f"module.env_under_test.docker_network.this": ("docker_network", f"stacknest-{env}"),
    f"module.env_under_test.docker_volume.db": ("docker_volume", f"stacknest-{env}-db"),
    f"module.env_under_test.docker_volume.redis": ("docker_volume", f"stacknest-{env}-redis"),
}
for addr, (rtype, rname) in expected.items():
    r = resources.get(addr)
    if not r:
        failures.append(f"Ressource manquante : {addr}")
        continue
    if r.get("type") != rtype:
        failures.append(f"{addr}: type {r.get('type')} != {rtype}")
    if r.get("values", {}).get("name") != rname:
        failures.append(f"{addr}: name {r.get('values', {}).get('name')} != {rname}")
    labels = {lbl.get("label"): lbl.get("value") for lbl in r.get("values", {}).get("labels", []) or []}
    for k, v in {"project": "stacknest", "env": env, "managed_by": "terraform"}.items():
        if labels.get(k) != v:
            failures.append(f"{addr}: label {k}={labels.get(k)} != {v}")

outputs = plan.get("planned_values", {}).get("outputs", {})
expected_out = {
    "network_name": f"stacknest-{env}",
    "db_volume_name": f"stacknest-{env}-db",
    "redis_volume_name": f"stacknest-{env}-redis",
}
for k, v in expected_out.items():
    actual = outputs.get(k, {}).get("value")
    if actual != v:
        failures.append(f"output {k}={actual} != {v}")

if failures:
    print("\n".join(f"  ✗ {f}" for f in failures))
    sys.exit(1)
print("  ✓ ressources + labels + outputs OK")
PY

rm -f plan.bin plan.json
green "OK — module env conforme"
