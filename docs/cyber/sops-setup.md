# SOPS + age — Setup équipe StackNest

Gestion des secrets du projet via [SOPS](https://github.com/getsops/sops) (Mozilla) + [age](https://github.com/FiloSottile/age) (chiffrement asymétrique moderne).

**Principe** : les fichiers secrets (ex: `secrets.dev.sops.env`) sont commités **chiffrés** dans le repo. Seuls les membres dont la clé publique figure dans `.sops.yaml` peuvent déchiffrer.

## Qui a besoin d'une clé ?

| Membre | Rôle | Envs déchiffrables |
|---|---|---|
| Samuel Ressiot | Dev lead | dev, test, preview, prod |
| Antony Lozano | Cyber | dev, test, preview, prod |
| Remi Reze | Cyber | dev, test, preview, prod |
| Thomas Bremard | Cyber | dev, test, preview, prod |
| Yassine Zouitni | Dev M1 | dev (uniquement) |

Les M1 cyber ont accès à tous les envs pour l'audit sécu. Les autres devs ont accès uniquement à `dev` par principe du moindre privilège.

## Installation

### Windows (via Scoop — recommandé)

```powershell
scoop install sops age
```

Alternatives :
- **Chocolatey** : `choco install sops age.portable`
- **Winget** : `winget install Mozilla.SOPS` puis `winget install FiloSottile.age`
- **WSL2** : utiliser la procédure Linux ci-dessous

### macOS (via Homebrew)

```bash
brew install sops age
```

### Linux (Ubuntu/Debian)

```bash
# age (apt)
sudo apt update && sudo apt install age

# sops (GitHub release — apt n'a qu'une version obsolète)
SOPS_VERSION="3.9.0"
curl -Lo sops "https://github.com/getsops/sops/releases/download/v${SOPS_VERSION}/sops-v${SOPS_VERSION}.linux.amd64"
sudo install -o root -g root -m 0755 sops /usr/local/bin/sops
rm sops
```

Alternative Linux : `sudo snap install sops` (canal stable).

### Vérification

```bash
sops --version   # ≥ 3.8
age --version    # ≥ 1.1
age-keygen --help
```

## Génération de ta clé age

Utilise le helper fourni :

```bash
bash scripts/cyber/generate-age-key.sh
```

Le script :
1. Vérifie la présence d'`age-keygen`
2. Crée `~/.sops/age/key.txt` avec permissions `0600` (lisible uniquement par toi)
3. Affiche ta **clé publique** (commence par `age1...`) à partager à l'équipe

**Manuellement** (si le script ne marche pas sur ton OS) :

```bash
mkdir -p ~/.sops/age && chmod 700 ~/.sops/age
age-keygen -o ~/.sops/age/key.txt
chmod 600 ~/.sops/age/key.txt
# La clé publique est imprimée dans stdout + dans le header du fichier key.txt
```

## Partage de ta clé publique

**⚠️ NE JAMAIS PARTAGER TA CLÉ PRIVÉE** (`~/.sops/age/key.txt`).

Partage uniquement ta **clé publique** (format `age1xxxxxxxx...`) à Samuel via :
- **Slack canal privé #stacknest-keys** (préféré — historique, vérifiable)
- Ou email chiffré / signal / canal sécurisé équivalent

Samuel crée le `.sops.yaml` réel en partant du template `.sops.yaml.example` : `cp .sops.yaml.example .sops.yaml`, puis remplace chaque `age1PLACEHOLDER_*` par la vraie clé publique du membre concerné, et commit. Le test `tests/infra/test_sops_setup.sh` validera strictement le format age une fois `.sops.yaml` présent.

## Sauvegarde de ta clé privée

**En cas de perte** (nouveau poste, disque corrompu) : tu ne peux plus déchiffrer les secrets passés. **Mitigation** :
- Backup de `~/.sops/age/key.txt` dans ton gestionnaire de mots de passe (1Password, Bitwarden, KeePass)
- Toujours ≥ 2 membres capables de déchiffrer chaque env (garantit la récupération même si un membre perd sa clé)
- Procédure de re-génération : générer nouvelle clé → partager nouvelle clé publique → re-chiffrer tous les secrets affectés (`sops updatekeys secrets.<env>.sops.env`)

## Utilisation au quotidien (une fois STN-31 livré)

### Chiffrer un nouveau secret

```bash
# Créer en clair (temporairement)
cat > secrets.dev.sops.env <<EOF
DB_PASSWORD=supersecret123
OPENAI_API_KEY=sk-xxx
EOF

# Chiffrer sur place
sops --encrypt --in-place secrets.dev.sops.env

# Commit le fichier chiffré
git add secrets.dev.sops.env && git commit -m "chore(secrets): add DB + OpenAI secrets for dev"
```

### Éditer un secret existant

```bash
sops secrets.dev.sops.env   # ouvre $EDITOR avec le contenu déchiffré en mémoire
# Modifier, sauvegarder, quitter → SOPS re-chiffre automatiquement
```

### Déchiffrer pour usage local

```bash
sops --decrypt secrets.dev.sops.env > .env.dev
# Utiliser .env.dev (jamais commit — déjà gitignoré)
```

## Rotation de clés (quand un membre part)

```bash
# 1. Retirer la clé publique du membre partant dans .sops.yaml
# 2. Re-chiffrer tous les secrets pour la nouvelle liste de recipients
find . -name 'secrets.*.sops.*' -exec sops updatekeys {} \;
# 3. Commit + PR
```

## Ressources

- [SOPS docs officielles](https://github.com/getsops/sops#readme)
- [age spec](https://age-encryption.org/)
- [Article Mozilla SOPS](https://blog.mozilla.org/security/2017/08/23/introducing-sops-safer-unified-secrets-management/)
