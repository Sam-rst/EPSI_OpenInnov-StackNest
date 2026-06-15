#!/usr/bin/env bash
# scripts/next-version.sh — derive la prochaine version SemVer de l'historique git.
#
# Inspire de semantic-release : la version se calcule a partir des sujets de
# commit (style Conventional Commits), pas a la main. On lit les commits depuis
# le dernier tag annote `vX.Y.Z` (ou depuis le 1er commit s'il n'y a pas de tag),
# on classe chaque sujet (feat / fix / autre) puis on applique le mapping SemVer
# du projet (cf. CLAUDE.md, section « Versioning & Conventional Commits »).
#
# Mapping pre-1.0 (0.y.z) :
#   feat                          -> bump MINOR (0.y.0), remet le PATCH a 0
#   fix                           -> bump PATCH (0.y.z+1)
#   docs/chore/refactor/test/ci/build/style/perf -> pas de bump
#   feat! / BREAKING CHANGE       -> bump MAJOR (a partir de la 1.0 seulement)
#
# Classification d'un sujet :
#   1. Prefixe Conventional Commit explicite : `type(scope): ...` ou `type: ...`
#      (feat, fix, docs, chore, refactor, test, ci, build, style, perf, init).
#   2. Repli par mots-cles pour l'ancien format de titre `STN — [Domaine] ...`.
#      Les mots-cles sont compares EN TANT QUE MOTS (bornes de mot), pour ne pas
#      matcher des sous-chaines fortuites (« Instan-ci-ation », « Buil-d-er »...) :
#        - fix    : mot `fix` | `corrige` | `correctif` | `bug`, ou tag `[fix]`
#        - docs   : tag de domaine `[docs]`
#        - chore  : tag de domaine `[chore]` | `[devops]` | `[infra]`, ou mot
#                   `chore` | `refactor` | `test` | `build` | `ci`
#        - sinon  : feat (toute autre evolution fonctionnelle, ex. `[Deploy]`,
#                   `[Stack]`, `[Chat]`, `[Catalogue]`, `[Auth]`, `[UI]`, `[UX]`).
#
# Usage :
#   bash scripts/next-version.sh            # prochaine version (stdout, ex. 0.79.0)
#   bash scripts/next-version.sh --verbose  # + recap feat/fix/autres sur stderr
#
# Sortie : la version « nue » sur stdout (sans prefixe `v`), pour pouvoir
#          l'injecter dans version.json / pyproject.toml / package.json.
#
# Portabilite : bash via WSL ou Git Bash (Windows natif hors scope).

set -euo pipefail

# --- Couleurs (le recap va sur stderr ; SEULE la version va sur stdout) ---
blue()  { printf "\033[34m%s\033[0m\n" "$*" >&2; }
hint()  { printf "%s\n" "$*" >&2; }
die()   { printf "\033[31mErreur : %s\033[0m\n" "$*" >&2; exit 1; }

VERBOSE=0
[[ "${1:-}" == "--verbose" || "${1:-}" == "-v" ]] && VERBOSE=1

git rev-parse --git-dir >/dev/null 2>&1 || die "pas dans un depot git."

# --- Point de depart : dernier tag annote vX.Y.Z, sinon 1er commit ---
last_tag="$(git describe --tags --abbrev=0 --match 'v[0-9]*' 2>/dev/null || true)"

if [[ -n "$last_tag" ]]; then
  base_version="${last_tag#v}"
  range="${last_tag}..HEAD"
  blue "Base : tag $last_tag — analyse de $last_tag..HEAD"
else
  base_version="0.0.0"
  range="HEAD"
  blue "Base : aucun tag vX.Y.Z — analyse depuis le 1er commit"
fi

major="${base_version%%.*}"
rest="${base_version#*.}"
minor="${rest%%.*}"
patch="${rest##*.}"

# --- Classement de chaque sujet de commit ---
feat_count=0
fix_count=0
other_count=0
breaking_count=0

# Itere du plus ancien au plus recent (l'ordre importe : un fix apres un feat
# bumpe le patch du nouveau minor, d'ou le reset du patch a chaque feat).
while IFS= read -r subject; do
  [[ -z "$subject" ]] && continue

  # Prefixe Conventional Commit explicite : type(scope)?!?:
  if [[ "$subject" =~ ^([a-z]+)(\([^\)]*\))?(!?): ]]; then
    type="${BASH_REMATCH[1]}"
    bang="${BASH_REMATCH[3]}"
  else
    type=""
    bang=""
  fi

  # Breaking change : `type!:` ou mention `BREAKING CHANGE` dans le sujet.
  if [[ "$bang" == "!" || "$subject" == *"BREAKING CHANGE"* ]]; then
    breaking_count=$((breaking_count + 1))
    if [[ "$major" -ge 1 ]]; then
      major=$((major + 1)); minor=0; patch=0
    else
      # Pre-1.0 : un breaking ne bump pas le major (SemVer 0.y.z), on le traite
      # comme un feat (bump minor) — convention du projet.
      minor=$((minor + 1)); patch=0; feat_count=$((feat_count + 1))
    fi
    continue
  fi

  # Si pas de prefixe conventionnel, on retombe sur l'ancien format de titre
  # `STN — [Domaine] ...`. On normalise en minuscules et on borne les mots-cles
  # (`\b...\b` GNU/BSD `[[:<:]]`/`[[:>:]]` indispo partout -> on encadre par des
  # caracteres non-alphabetiques) pour eviter les faux positifs sur sous-chaine.
  if [[ -z "$type" ]]; then
    lc=" $(printf '%s' "$subject" | tr '[:upper:]' '[:lower:]') "
    if [[ "$lc" == *"[fix]"* ]] \
       || [[ "$lc" =~ [^a-z](fix|corrige|correctif|correctifs|bug)[^a-z] ]]; then
      type="fix"
    elif [[ "$lc" == *"[docs]"* ]]; then
      type="docs"
    elif [[ "$lc" == *"[chore]"* ]] \
       || [[ "$lc" =~ [^a-z](chore|refactor|refacto)[^a-z] ]]; then
      type="chore"
    else
      # Toute autre evolution (incl. [DevOps], [Infra], [Core], [Store],
      # [Deploy], [Stack], [Chat], [Catalogue], [Auth], [UI], [UX]) = feat.
      type="feat"
    fi
  fi

  case "$type" in
    feat)
      minor=$((minor + 1)); patch=0; feat_count=$((feat_count + 1)) ;;
    fix)
      patch=$((patch + 1)); fix_count=$((fix_count + 1)) ;;
    docs|chore|refactor|test|ci|build|style|perf|init)
      other_count=$((other_count + 1)) ;;
    *)
      # Type inconnu -> pas de bump (conservateur).
      other_count=$((other_count + 1)) ;;
  esac
done < <(git log "$range" --no-merges --format='%s' --reverse)

next_version="${major}.${minor}.${patch}"

if [[ "$VERBOSE" == "1" ]]; then
  hint ""
  hint "  feat     : $feat_count  (bump minor)"
  hint "  fix      : $fix_count  (bump patch)"
  hint "  breaking : $breaking_count"
  hint "  autres   : $other_count  (docs/chore/refactor/test/ci/build/style/perf — pas de bump)"
  hint ""
  blue "Version derivee : $next_version  (base $base_version)"
fi

# La version nue sur stdout (capturable : VERSION=$(bash scripts/next-version.sh)).
printf '%s\n' "$next_version"
