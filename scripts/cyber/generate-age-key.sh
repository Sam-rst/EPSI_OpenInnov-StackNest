#!/usr/bin/env bash
# Génère une paire de clés age pour SOPS et affiche la clé publique à partager.
# Usage : bash scripts/cyber/generate-age-key.sh
#
# Produit :
#   - ~/.sops/age/key.txt (permissions 0600) — clé PRIVÉE, à ne JAMAIS partager
#   - stdout : clé PUBLIQUE (age1...) à partager à Samuel via canal sécurisé
#
# Cf. docs/cyber/sops-setup.md pour le workflow complet (partage, rotation, backup).

set -euo pipefail

red()    { printf "\033[31m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }

KEY_DIR="${HOME}/.sops/age"
KEY_FILE="${KEY_DIR}/key.txt"

# 1. Vérifier prérequis
if ! command -v age-keygen >/dev/null 2>&1; then
    red "age-keygen introuvable — installe age (cf. docs/cyber/sops-setup.md)"
    exit 1
fi

# 2. Prévenir si clé existante
if [[ -f "${KEY_FILE}" ]]; then
    yellow "⚠️  Une clé existe déjà : ${KEY_FILE}"
    yellow "   La régénérer rendra ILLISIBLES tous les secrets chiffrés avec l'ancienne clé."
    yellow "   Annule (Ctrl+C) si tu n'es pas sûr. Tape 'oui' / 'yes' / 'y' / 'o' pour régénérer :"
    read -r confirm
    if [[ ! "${confirm,,}" =~ ^(oui|yes|y|o)$ ]]; then
        yellow "Annulé."
        exit 0
    fi
    BACKUP="${KEY_FILE}.backup.$(date +%Y%m%d-%H%M%S)"
    mv "${KEY_FILE}" "${BACKUP}"
    yellow "Ancienne clé sauvegardée : ${BACKUP}"
fi

# 3. Créer dossier sécurisé
mkdir -p "${KEY_DIR}"
chmod 700 "${KEY_DIR}"

# 4. Générer la clé (stderr d'age-keygen laissé visible pour faciliter le troubleshooting)
age-keygen -o "${KEY_FILE}"
chmod 600 "${KEY_FILE}"

# 5. Extraire la clé publique
PUBLIC_KEY=$(grep '^# public key:' "${KEY_FILE}" | sed 's/^# public key: //')

if [[ -z "${PUBLIC_KEY}" ]]; then
    red "Échec extraction de la clé publique depuis ${KEY_FILE}"
    exit 1
fi

# 6. Afficher les instructions
green "✓ Clé age générée avec succès"
echo
echo "Clé privée : ${KEY_FILE} (0600 — NE JAMAIS PARTAGER)"
echo
yellow "Clé publique à partager à Samuel via Slack #stacknest-keys :"
echo
echo "    ${PUBLIC_KEY}"
echo
yellow "Prochaines étapes :"
echo "  1. Copie la clé publique ci-dessus"
echo "  2. Partage-la sur Slack canal privé #stacknest-keys"
echo "  3. Sauvegarde ${KEY_FILE} dans ton gestionnaire de mots de passe"
echo "  4. Samuel ajoutera ta clé publique dans .sops.yaml"
