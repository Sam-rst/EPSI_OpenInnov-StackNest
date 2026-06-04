#!/usr/bin/env bash
# scripts/worktree.sh — convention worktree multi-agents StackNest (STN-156).
#
# Permet à plusieurs agents/devs de travailler en parallèle sur le même dépôt,
# chacun dans un git worktree isolé doté de sa propre stack Docker (nom de projet
# Compose unique + 7 ports décalés). Chaque worktree obtient un « slot » ; le slot 0
# est réservé au dépôt principal (ports par défaut).
#
# Sous-commandes :
#   new   <branche>          Crée un worktree depuis `main`, .env isolé, installe les deps
#   list                     Liste les worktrees enregistrés (slot, branche, projet, chemin)
#   rm    <branche>          Supprime le worktree et libère le slot
#   ports <branche|slot>     Affiche les 7 ports attribués
#
# Variables d'environnement :
#   WORKTREE_BASE_REF    Référence de base des nouveaux worktrees (défaut: main)
#   WORKTREE_MAX_SLOTS   Nombre max de slots simultanés (défaut: 9)
#   WORKTREE_SKIP_INSTALL=1  Saute npm install + uv sync (utilisé par les tests)
#
# Portabilité : bash via WSL ou Git Bash (Windows natif hors scope).

set -euo pipefail

# --- Couleurs (statut/erreurs sur stderr ; les données vont sur stdout) ---
red()   { printf "\033[31m%s\033[0m\n" "$*" >&2; }
green() { printf "\033[32m%s\033[0m\n" "$*" >&2; }
blue()  { printf "\033[34m%s\033[0m\n" "$*" >&2; }
hint()  { printf "%s\n" "$*" >&2; }
die()   { red "Erreur : $*"; exit 1; }

# --- Interpréteur Python (manipulation du registre JSON) ---
# On passe par `uv run --no-project python` : uv est l'outil Python du projet et
# fournit un interpréteur fiable (le `python` système est un stub Store sous
# Windows). `--no-project` → interpréteur isolé (seule la stdlib json est requise),
# sans dépendre du venv d'apps/api ni déclencher de sync.
command -v uv >/dev/null 2>&1 || die "uv requis (https://docs.astral.sh/uv/) pour manipuler le registre"
PY=(uv run --no-project python)

# --- Résolution du dépôt principal (robuste depuis n'importe quel worktree) ---
GIT_COMMON_DIR="$(cd "$(git rev-parse --git-common-dir 2>/dev/null)" 2>/dev/null && pwd)" \
    || die "ce script doit être exécuté dans un dépôt git"
MAIN_ROOT="$(dirname "${GIT_COMMON_DIR}")"
WT_DIR="${MAIN_ROOT}/.worktrees"
REGISTRY_FILE="${WT_DIR}/registry.json"

BASE_REF="${WORKTREE_BASE_REF:-main}"
MAX_SLOTS="${WORKTREE_MAX_SLOTS:-9}"

# Bases de calcul des 7 ports — formule : base + slot×100.
PORT_SPECS=(
    "POSTGRES_PORT:5432"
    "REDIS_PORT:6379"
    "API_PORT:8000"
    "UI_PORT:8080"
    "MAILHOG_SMTP_PORT:1025"
    "MAILHOG_UI_PORT:8025"
    "OLLAMA_PORT:11434"
)

# --- Helpers ---------------------------------------------------------------

slugify()      { printf '%s' "${1//\//-}"; }
now_iso()      { date -u +%Y-%m-%dT%H:%M:%SZ; }
project_name() { [[ "$1" -eq 0 ]] && printf 'stacknest' || printf 'stacknest-wt%s' "$1"; }

# Affiche les 7 lignes VAR=port pour un slot donné (sur stdout — c'est une donnée).
compute_ports() {
    local slot="$1" spec var base
    for spec in "${PORT_SPECS[@]}"; do
        var="${spec%%:*}"; base="${spec##*:}"
        printf '%s=%d\n' "${var}" "$(( base + slot * 100 ))"
    done
}

ensure_registry() {
    mkdir -p "${WT_DIR}"
    [[ -f "${REGISTRY_FILE}" ]] || printf '{\n  "version": 1,\n  "slots": {}\n}\n' > "${REGISTRY_FILE}"
}

# Avertit (sans bloquer) si .worktrees/ n'est pas ignoré par git.
check_ignored() {
    git -C "${MAIN_ROOT}" check-ignore -q .worktrees/registry.json \
        || red "⚠ .worktrees/ n'est pas ignoré par git — ajoute '.worktrees/' à .gitignore (risque de commit accidentel)."
}

# Pilote le registre JSON via Python. Usage : reg <action> [args...]
reg() {
    "${PY[@]}" - "${REGISTRY_FILE}" "$@" <<'PYEOF'
import json, os, sys

path, action, args = sys.argv[1], sys.argv[2], sys.argv[3:]

def load():
    if not os.path.exists(path):
        return {"version": 1, "slots": {}}
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def save(data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

data = load()
slots = data.setdefault("slots", {})

if action == "slot_of":            # args: branch  -> imprime le slot ou rien
    branch = args[0]
    for slot, info in slots.items():
        if info.get("branch") == branch:
            print(slot)
            break
elif action == "free_slot":        # args: max     -> 1er slot libre dans 1..max ou rien
    for slot in range(1, int(args[0]) + 1):
        if str(slot) not in slots:
            print(slot)
            break
elif action == "add":              # args: slot branch path project created_at
    slot, branch, wt_path, project, created = args
    slots[slot] = {"branch": branch, "path": wt_path, "project": project, "created_at": created}
    save(data)
elif action == "remove":           # args: branch
    branch = args[0]
    for slot in [s for s, i in slots.items() if i.get("branch") == branch]:
        del slots[slot]
    save(data)
elif action == "list":             # lignes TSV: slot branch project path
    for slot in sorted(slots, key=int):
        info = slots[slot]
        print("\t".join((slot, info.get("branch", ""), info.get("project", ""), info.get("path", ""))))
else:
    sys.exit(f"action de registre inconnue: {action}")
PYEOF
}

# Résout un argument (slot numérique OU nom de branche) en numéro de slot.
resolve_slot() {
    local arg="$1" slot
    if [[ "${arg}" =~ ^[0-9]+$ ]]; then
        printf '%s' "${arg}"; return 0
    fi
    slot="$(reg slot_of "${arg}")"
    [[ -n "${slot}" ]] || return 1
    printf '%s' "${slot}"
}

install_deps() {
    local path="$1"
    blue "Installation des dépendances (npm install + uv sync)…"
    # Les dossiers absents sont sautés ; un échec d'install reste fatal (set -e).
    if [[ -f "${path}/apps/web/package.json" ]]; then ( cd "${path}/apps/web" && npm install ); fi
    if [[ -f "${path}/apps/api/pyproject.toml" ]]; then ( cd "${path}/apps/api" && uv sync ); fi
}

# --- Sous-commandes --------------------------------------------------------

cmd_new() {
    local branch="${1:-}"
    [[ -n "${branch}" ]] || die "usage : worktree.sh new <branche>"
    ensure_registry
    check_ignored

    [[ -z "$(reg slot_of "${branch}")" ]] || die "un worktree est déjà enregistré pour la branche : ${branch}"

    local slot; slot="$(reg free_slot "${MAX_SLOTS}")"
    [[ -n "${slot}" ]] || die "aucun slot libre (max ${MAX_SLOTS}). Libère-en un : worktree.sh rm <branche>"

    local slug path project
    slug="$(slugify "${branch}")"
    path="${WT_DIR}/${slug}"
    project="$(project_name "${slot}")"

    [[ ! -e "${path}" ]] || die "le chemin existe déjà : ${path}"

    git -C "${MAIN_ROOT}" worktree add "${path}" -b "${branch}" "${BASE_REF}" >&2 \
        || die "échec de 'git worktree add' (la branche '${branch}' existe peut-être déjà)"

    {
        echo "# Généré par scripts/worktree.sh (STN-156) — slot ${slot}. Ne pas committer."
        echo "COMPOSE_PROJECT_NAME=${project}"
        compute_ports "${slot}"
    } > "${path}/.env"

    reg add "${slot}" "${branch}" ".worktrees/${slug}" "${project}" "$(now_iso)"

    [[ "${WORKTREE_SKIP_INSTALL:-0}" == "1" ]] || install_deps "${path}"

    green "✓ worktree créé : ${path} (slot ${slot}, projet ${project})"
    hint "  cd ${path} && docker compose -f docker-compose.yml -f docker-compose.dev.yml up"
    hint "  ports : $(compute_ports "${slot}" | paste -sd' ' -)"
}

cmd_list() {
    ensure_registry
    local rows; rows="$(reg list)"
    if [[ -z "${rows}" ]]; then
        hint "Aucun worktree enregistré (slot 0 = dépôt principal)."
        return 0
    fi
    printf '%-5s %-48s %-18s %s\n' "SLOT" "BRANCHE" "PROJET" "CHEMIN"
    local slot branch project path
    while IFS=$'\t' read -r slot branch project path; do
        printf '%-5s %-48s %-18s %s\n' "${slot}" "${branch}" "${project}" "${path}"
    done <<<"${rows}"
}

cmd_rm() {
    local branch="${1:-}"
    [[ -n "${branch}" ]] || die "usage : worktree.sh rm <branche>"
    ensure_registry

    local slot; slot="$(reg slot_of "${branch}")"
    [[ -n "${slot}" ]] || die "aucun worktree enregistré pour la branche : ${branch}"

    local slug path project
    slug="$(slugify "${branch}")"
    path="${WT_DIR}/${slug}"
    project="$(project_name "${slot}")"

    blue "Pense à arrêter la stack Docker du worktree si elle tourne :"
    hint "  docker compose -p ${project} down -v"

    git -C "${MAIN_ROOT}" worktree remove --force "${path}" >/dev/null 2>&1 || rm -rf "${path}"
    git -C "${MAIN_ROOT}" worktree prune >/dev/null 2>&1 || true
    reg remove "${branch}"

    green "✓ worktree supprimé et slot ${slot} libéré : ${branch}"
}

cmd_ports() {
    local arg="${1:-}"
    [[ -n "${arg}" ]] || die "usage : worktree.sh ports <branche|slot>"
    local slot
    slot="$(resolve_slot "${arg}")" || die "worktree introuvable dans le registre : ${arg}"
    compute_ports "${slot}"
}

usage() {
    cat >&2 <<'USAGE'
worktree.sh — convention worktree multi-agents StackNest (STN-156)

Usage :
  scripts/worktree.sh new   <branche>        Crée un worktree isolé (slot + .env + deps)
  scripts/worktree.sh list                   Liste les worktrees enregistrés
  scripts/worktree.sh rm    <branche>        Supprime le worktree et libère le slot
  scripts/worktree.sh ports <branche|slot>   Affiche les 7 ports attribués

Exemple :
  scripts/worktree.sh new feature/STN-200-ma-feature
  cd .worktrees/feature-STN-200-ma-feature
  docker compose -f docker-compose.yml -f docker-compose.dev.yml up
USAGE
}

main() {
    local cmd="${1:-}"
    [[ $# -gt 0 ]] && shift || true
    case "${cmd}" in
        new)   cmd_new "$@" ;;
        list)  cmd_list "$@" ;;
        rm)    cmd_rm "$@" ;;
        ports) cmd_ports "$@" ;;
        ""|-h|--help|help) usage ;;
        *) red "commande inconnue : ${cmd}"; usage; exit 1 ;;
    esac
}

main "$@"
