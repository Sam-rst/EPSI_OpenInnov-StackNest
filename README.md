# 🥚 StackNest

> **Build Fast. Deploy Smart.**

![Project Status](https://img.shields.io/badge/Status-Development-orange)
![Version](https://img.shields.io/badge/Version-0.1.0-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

## 📖 À propos

[cite_start]**StackNest** est une **Plateforme d'Ingénierie Interne (Internal Developer Platform - IDP)** conçue pour combler le fossé entre les développeurs et les équipes Ops[cite: 22].

[cite_start]Actuellement, les développeurs perdent du temps à créer des tickets pour obtenir des ressources (VM, Bases de données), créant frustration et "Shadow IT"[cite: 25]. [cite_start]**StackNest** résout ce problème en offrant un **guichet unique (Store)** permettant de provisionner des ressources IT de manière autonome, sécurisée et standardisée[cite: 22].

### 🚀 Notre Mission
* **Autonomie :** Libérer les développeurs des tickets d'attente.
* **Contrôle :** Standardiser l'infrastructure via l'IaC (Terraform/Ansible).
* **Innovation :** Intégrer l'IA pour simplifier les demandes complexes (ChatOps).

---

## ✨ Fonctionnalités Clés

* [cite_start]🛒 **Service Catalog (Store) :** Une interface web intuitive pour commander des ressources (S3, EC2, PGSQL) en quelques clics[cite: 40].
* [cite_start]🤖 **AI ChatOps :** Un assistant intelligent capable de traduire des demandes naturelles (ex: *"Je veux un env de dev pour une app Node"*) en configuration Terraform valide[cite: 40].
* [cite_start]⚙️ **Automation Engine :** Exécution automatisée et isolée des scripts Terraform et Ansible[cite: 40].
* [cite_start]🔐 **Sécurité & Conformité :** Gestion des secrets via **Vault**, authentification forte (OAuth2/OIDC) et RBAC strict[cite: 41, 45].
* [cite_start]📊 **Dashboard & FinOps :** Vue d'ensemble des déploiements et estimation des coûts cloud[cite: 40].

---

## 🛠 Stack Technique

[cite_start]Le projet repose sur une architecture moderne et conteneurisée[cite: 44, 54]:

| Composant | Technologie | Description |
| :--- | :--- | :--- |
| **Frontend** | React.js / Next.js | Interface réactive et Widget Chat |
| **Backend** | Python (FastAPI) / Go | API, Logique métier et Connecteur IA |
| **Database** | PostgreSQL | Stockage utilisateurs, logs et catalogue |
| **IaC** | Terraform & Ansible | Moteur de déploiement et configuration |
| **IA / LLM** | OpenAI (GPT-4o) / Ollama | Interprétation des prompts utilisateurs |
| **Sécurité** | Hashicorp Vault | Gestion centralisée des secrets |
| **Infra** | Docker Compose | Conteneurisation pour le dév et la démo |

---

## ⚡ Installation & Démarrage

### Prérequis
* Docker & Docker Compose installés sur votre machine.
* Clés API (AWS/Azure) pour les tests de déploiement réel.

### Lancement Rapide

1.  **Cloner le dépôt :**
    ```bash
    git clone [https://github.com/votre-orga/stacknest.git](https://github.com/votre-orga/stacknest.git)
    cd stacknest
    ```

2.  **Configurer l'environnement :**
    Dupliquez le fichier `.env.example` en `.env` et renseignez vos secrets (Clés API, Token LLM).
    ```bash
    cp .env.example .env
    ```

3.  **Lancer la stack (Mode Dev) :**
    ```bash
    docker-compose up --build
    ```

4.  **Accéder à l'application :**
    * Frontend : `http://localhost:3000`
    * API Docs (Swagger) : `http://localhost:8000/docs`

---

## 🗺️ Roadmap

[cite_start]Le développement suit un cycle d'innovation sur 5 mois[cite: 57]:

- [ ] **Phase 1 (Janvier) :** Conception, UX/UI, Socle Docker & BDD.
- [ ] **Phase 2 (Fev - Mars) :** MVP du Store, Moteur Terraform, Auth & Vault.
- [ ] **Phase 3 (Avril) :** Intégration du Chatbot IA & Sécurité avancée.
- [ ] **Phase 4 (Mai) :** Dashboard, Tests finaux et Livraison.

---

## 👥 L'Équipe (Projet 2427-01)

**Développement (M1 DEV)**
* Samuel RESSIOT
* Yassine ZOUITNI

**Cybersécurité & Compliance (M1 CYBER)**
* Antony LOZANO
* Rémi REZE
* Thomas BREMARD

**Business & Produit (B1)**
* Julien VOLMERANGE
* Mahé PERNOT

---

## 🎨 Charte Graphique

* [cite_start]**Police :** Inter / Roboto (UI), JetBrains Mono (Code)[cite: 48].
* **Couleurs Principales :**
    * 🔵 Bleu Nuit : `#032233`
    * 🔵 Cyan : `#0d9297`
    * 🟠 Jaune (Accent) : `#fea21f`

---

[cite_start]*Projet réalisé dans le cadre du Cycle d'Innovation 2025-2026.* [cite: 5]