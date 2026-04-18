#!/usr/bin/env bash
# Smoke test du stack Docker Compose dev StackNest (STN-11).
#
# Verifie que :
#   - les fichiers docker-compose.yml et docker-compose.dev.yml existent
#   - `docker compose config` valide la composition (base + override)
#   - `docker compose up -d` demarre les services principaux
#   - les endpoints transverses repondent :
#       * http://localhost:8080/           -> 200 (UI servie par Nginx)
#       * http://localhost:8080/api/health -> 200 {"status":"ok"} (proxy vers API)
#   - le teardown `docker compose down -v` nettoie conteneurs et volumes

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASE_FILE="${ROOT_DIR}/docker-compose.yml"
DEV_FILE="${ROOT_DIR}/docker-compose.dev.yml"
UI_URL="http://localhost:8080/"
API_URL="http://localhost:8080/api/health"
READY_TIMEOUT=120

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
blue()  { printf "\033[34m%s\033[0m\n" "$*"; }

if ! command -v docker >/dev/null 2>&1; then
    red "docker CLI introuvable dans le PATH"
    exit 1
fi

[[ -f "${BASE_FILE}" ]] || { red "Fichier manquant : ${BASE_FILE}"; exit 1; }
[[ -f "${DEV_FILE}" ]]  || { red "Fichier manquant : ${DEV_FILE}"; exit 1; }

COMPOSE=(docker compose -f "${BASE_FILE}" -f "${DEV_FILE}" --project-directory "${ROOT_DIR}")

cleanup() {
    blue "[cleanup] docker compose down -v"
    "${COMPOSE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

blue "[1/4] docker compose config (validation syntaxique)"
"${COMPOSE[@]}" config >/dev/null
green "  OK"

blue "[2/4] docker compose up -d --build (peut prendre 2-3 min au premier run)"
"${COMPOSE[@]}" up -d --build

blue "[3/4] Attente de la disponibilite des endpoints (timeout ${READY_TIMEOUT}s)"
wait_for() {
    local url="$1" expected="$2" name="$3"
    local deadline=$(( $(date +%s) + READY_TIMEOUT ))
    while (( $(date +%s) < deadline )); do
        local code
        code=$(curl -s -o /dev/null -w '%{http_code}' "${url}" || echo "000")
        if [[ "${code}" == "${expected}" ]]; then
            green "  ${name} -> ${code}"
            return 0
        fi
        sleep 2
    done
    red "  ${name} n'a pas repondu ${expected} en ${READY_TIMEOUT}s (dernier code: ${code:-???})"
    "${COMPOSE[@]}" logs --tail=30
    return 1
}
wait_for "${UI_URL}"  "200" "UI   ${UI_URL}"
wait_for "${API_URL}" "200" "API  ${API_URL}"

blue "[4/4] Verification payload /api/health"
body=$(curl -s "${API_URL}")
if ! echo "${body}" | grep -q '"status"[[:space:]]*:[[:space:]]*"ok"'; then
    red "  Payload inattendu : ${body}"
    exit 1
fi
green "  Payload OK : ${body}"

green "STN-11 smoke test : OK"
