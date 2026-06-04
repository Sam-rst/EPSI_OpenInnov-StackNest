#!/usr/bin/env bash
# Test d'intégration de la convention worktree multi-agents (STN-156).
# Valide :
#   Structurel — scripts/worktree.sh présent + exécutable
#   CA2 — docker-compose.yml variabilise le nom de projet (COMPOSE_PROJECT_NAME)
#   CA1 (garde-fou) — .worktrees/ est ignoré par git
#   Structurel — .env.example documente COMPOSE_PROJECT_NAME + les 7 ports
#   CA5/CA3 — `ports <slot>` applique base + slot×100 (slot 0 = défaut) + unicité inter-slots
#   CA1 — `new` crée le worktree + .env (COMPOSE_PROJECT_NAME + 7 ports) + slot dans le registre
#   CA4 — `list` affiche le worktree ; `rm` supprime worktree + libère le slot
#   CA5 — `ports <branche>` résout la branche via le registre
#   parcours alt. — `new` refuse une branche déjà enregistrée ; échoue si plus de slot libre
#
# N'exécute PAS npm install / uv sync (WORKTREE_SKIP_INSTALL=1) pour rester rapide.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="${ROOT_DIR}/scripts/worktree.sh"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
ENV_EXAMPLE="${ROOT_DIR}/.env.example"

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
blue()  { printf "\033[34m%s\033[0m\n" "$*"; }

FAIL=0

# Variables attendues dans .env.example ET dans le .env généré par `new`.
EXPECTED_VARS=(COMPOSE_PROJECT_NAME API_PORT UI_PORT POSTGRES_PORT REDIS_PORT OLLAMA_PORT MAILHOG_SMTP_PORT MAILHOG_UI_PORT)
# Bases de calcul des 7 ports (formule : base + slot×100).
PORT_SPECS=("POSTGRES_PORT:5432" "REDIS_PORT:6379" "API_PORT:8000" "UI_PORT:8080" "MAILHOG_SMTP_PORT:1025" "MAILHOG_UI_PORT:8025" "OLLAMA_PORT:11434")

# Branches/worktrees jetables (uniques au PID) pour ne pas polluer le dépôt.
TEST_BRANCH="test/worktree-stn156-$$"
TEST_SLUG="test-worktree-stn156-$$"
TEST_WT_DIR="${ROOT_DIR}/.worktrees/${TEST_SLUG}"
TEST_BRANCHES=("${TEST_BRANCH}" "${TEST_BRANCH}-b")

export WORKTREE_SKIP_INSTALL=1

cleanup() {
    blue "[cleanup] suppression worktrees + branches de test"
    for b in "${TEST_BRANCHES[@]}"; do
        if [[ -x "${SCRIPT}" ]]; then "${SCRIPT}" rm "${b}" >/dev/null 2>&1 || true; fi
        slug="${b//\//-}"
        git -C "${ROOT_DIR}" worktree remove --force "${ROOT_DIR}/.worktrees/${slug}" >/dev/null 2>&1 || true
        git -C "${ROOT_DIR}" branch -D "${b}" >/dev/null 2>&1 || true
    done
    git -C "${ROOT_DIR}" worktree prune >/dev/null 2>&1 || true
}
trap cleanup EXIT

# --- Structurel : script présent + exécutable ---
if [[ -f "${SCRIPT}" && -x "${SCRIPT}" ]]; then
    green "  [OK] scripts/worktree.sh présent et exécutable"
else
    red "  [FAIL] scripts/worktree.sh manquant ou non exécutable"; FAIL=1
fi

# --- CA2 : nom de projet Compose variabilisé ---
if grep -Fq 'name: ${COMPOSE_PROJECT_NAME:-stacknest}' "${COMPOSE_FILE}"; then
    green "  [OK] CA2 — docker-compose.yml variabilise COMPOSE_PROJECT_NAME"
else
    red "  [FAIL] CA2 — docker-compose.yml ne contient pas 'name: \${COMPOSE_PROJECT_NAME:-stacknest}'"; FAIL=1
fi

# --- CA1 garde-fou : .worktrees/ ignoré par git ---
if git -C "${ROOT_DIR}" check-ignore -q .worktrees/registry.json; then
    green "  [OK] .worktrees/ est ignoré par git"
else
    red "  [FAIL] .worktrees/ n'est pas ignoré par git (risque de commit accidentel)"; FAIL=1
fi

# --- Structurel : .env.example documente COMPOSE_PROJECT_NAME + 7 ports ---
missing=()
for v in "${EXPECTED_VARS[@]}"; do
    grep -Eq "^[# ]*${v}=" "${ENV_EXAMPLE}" || missing+=("${v}")
done
if [[ ${#missing[@]} -eq 0 ]]; then
    green "  [OK] .env.example documente COMPOSE_PROJECT_NAME + 7 ports"
else
    red "  [FAIL] .env.example : variables manquantes : ${missing[*]}"; FAIL=1
fi

# --- CA5/CA3 : calcul des ports base + slot×100 ---
check_ports() {
    local slot="$1" out var base expected ok=1 spec
    out="$("${SCRIPT}" ports "${slot}")" || { red "    'ports ${slot}' a échoué"; return 1; }
    for spec in "${PORT_SPECS[@]}"; do
        var="${spec%%:*}"; base="${spec##*:}"
        expected=$(( base + slot * 100 ))
        grep -Eq "^${var}=${expected}$" <<<"${out}" || { red "    slot ${slot}: attendu ${var}=${expected}"; ok=0; }
    done
    [[ ${ok} -eq 1 ]]
}
if [[ -x "${SCRIPT}" ]]; then
    if check_ports 0 && check_ports 1 && check_ports 2; then
        green "  [OK] CA5/CA3 — ports = base + slot×100 (slot 0 = défaut)"
    else
        red "  [FAIL] CA5/CA3 — calcul de ports incorrect"; FAIL=1
    fi
else
    red "  [FAIL] CA5/CA3 — script absent, calcul de ports non testable"; FAIL=1
fi

# --- CA1/CA4/CA5 + parcours alternatifs : cycle new → list → ports → rm ---
if [[ -x "${SCRIPT}" ]]; then
    blue "[CA1] ${SCRIPT##*/} new ${TEST_BRANCH}"
    if "${SCRIPT}" new "${TEST_BRANCH}" >/dev/null 2>&1; then
        [[ -d "${TEST_WT_DIR}" ]] \
            && green "  [OK] CA1 — worktree créé dans .worktrees/" \
            || { red "  [FAIL] CA1 — worktree absent (${TEST_WT_DIR})"; FAIL=1; }

        ENV_FILE="${TEST_WT_DIR}/.env"
        if [[ -f "${ENV_FILE}" ]]; then
            envmissing=()
            for v in "${EXPECTED_VARS[@]}"; do
                grep -Eq "^${v}=" "${ENV_FILE}" || envmissing+=("${v}")
            done
            [[ ${#envmissing[@]} -eq 0 ]] \
                && green "  [OK] CA1 — .env généré (COMPOSE_PROJECT_NAME + 7 ports)" \
                || { red "  [FAIL] CA1 — .env incomplet : ${envmissing[*]}"; FAIL=1; }
        else
            red "  [FAIL] CA1 — .env non généré dans le worktree"; FAIL=1
        fi

        "${SCRIPT}" list 2>/dev/null | grep -q "${TEST_BRANCH}" \
            && green "  [OK] CA4 — list affiche le worktree" \
            || { red "  [FAIL] CA4 — list n'affiche pas le worktree"; FAIL=1; }

        if [[ "$("${SCRIPT}" ports "${TEST_BRANCH}" 2>/dev/null | grep -Ec '^[A-Z_]+=[0-9]+$')" -eq 7 ]]; then
            green "  [OK] CA5 — ports <branche> résout via le registre"
        else
            red "  [FAIL] CA5 — ports <branche> ne renvoie pas 7 ports"; FAIL=1
        fi

        if "${SCRIPT}" new "${TEST_BRANCH}" >/dev/null 2>&1; then
            red "  [FAIL] parcours alt. — 'new' aurait dû refuser une branche déjà enregistrée"; FAIL=1
        else
            green "  [OK] parcours alt. — 'new' refuse une branche déjà enregistrée"
        fi

        if WORKTREE_MAX_SLOTS=1 "${SCRIPT}" new "${TEST_BRANCH}-b" >/dev/null 2>&1; then
            red "  [FAIL] parcours alt. — 'new' aurait dû échouer (aucun slot libre)"; FAIL=1
        else
            green "  [OK] parcours alt. — 'new' échoue quand aucun slot n'est libre"
        fi

        if "${SCRIPT}" rm "${TEST_BRANCH}" >/dev/null 2>&1; then
            { [[ ! -d "${TEST_WT_DIR}" ]] && ! "${SCRIPT}" list 2>/dev/null | grep -q "${TEST_BRANCH}"; } \
                && green "  [OK] CA4 — rm supprime le worktree et libère le slot" \
                || { red "  [FAIL] CA4 — rm n'a pas nettoyé le worktree/slot"; FAIL=1; }
        else
            red "  [FAIL] CA4 — 'rm' a échoué"; FAIL=1
        fi
    else
        red "  [FAIL] CA1 — 'new ${TEST_BRANCH}' a échoué"; FAIL=1
    fi
else
    red "  [FAIL] CA1/CA4/CA5 — script absent, cycle new/list/rm non testable"; FAIL=1
fi

echo
if [[ ${FAIL} -eq 0 ]]; then
    green "✓ Tous les scénarios worktree (STN-156) passent"
    exit 0
else
    red "✗ Des scénarios worktree (STN-156) ont échoué"
    exit 1
fi
