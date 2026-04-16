---
name: deploy
description: Guide deployment process for StackNest environments. Use when deploying to dev, test, preview, or prod. Triggers on "deploy", "release", "mise en prod", "env.sh", "tag", "workflow_dispatch", or when managing environments. Ensures the right version goes to the right environment with proper checks.
---

# Deploy — Environment Deployment Guide

Guide the deployment of StackNest to the right environment with proper checks. All deployments are manual (workflow_dispatch) — never automatic.

## When to use

- Deploying to any environment (dev, test, preview, prod)
- Creating a release candidate tag
- Creating a release tag
- Managing environment switches (start/stop)

## Environments

| Env | Purpose | Version source | Who tests |
|---|---|---|---|
| **dev** | Continuous development | main (latest commit) | Devs + team |
| **test** | Pentest security | tag rc (frozen) | Cyber |
| **preview** | QA / acceptance | tag rc (after pentest) | Tech lead + B1 |
| **prod** | Production / jury demo | tag release | Everyone |

**Rule: 1 active at a time** (constraint: server resources). Dev is the default when no one is testing.

## Deployment checklist

### Deploy to DEV

```bash
# Via GitHub Actions
# → Actions → CD - Deploy → Run workflow
#   environment: dev
#   version: (leave empty = main latest)
```

Pre-checks:
- [ ] CI is green on main
- [ ] No one is currently pentesting (test env) or doing QA (preview env)

### Deploy to TEST (pentest)

```bash
# 1. Create release candidate tag
git tag v0.X.0-rc.1
git push origin v0.X.0-rc.1

# 2. Deploy via GitHub Actions
# → Actions → CD - Deploy → Run workflow
#   environment: test
#   version: v0.X.0-rc.1
```

Pre-checks:
- [ ] All sprint features are merged to main
- [ ] CI is green
- [ ] Cyber team is ready to start pentesting
- [ ] Communicate to team: "DEV will be offline during pentest"

### Deploy to PREVIEW (QA)

```bash
# Via GitHub Actions
# → Actions → CD - Deploy → Run workflow
#   environment: preview
#   version: v0.X.0-rc.N (latest RC after pentest fixes)
```

Pre-checks:
- [ ] Pentest findings are fixed (or accepted)
- [ ] All bugfix tags merged (rc.2, rc.3...)
- [ ] Cyber team has finished audit

### Deploy to PROD

```bash
# 1. Create release tag
git tag v0.X.0
git push origin v0.X.0

# 2. Deploy via GitHub Actions
# → Actions → CD - Deploy → Run workflow
#   environment: prod
#   version: v0.X.0

# 3. Return to dev
# → Actions → CD - Deploy → Run workflow
#   environment: dev
```

Pre-checks:
- [ ] QA passed on preview
- [ ] All CAs validated
- [ ] version.json updated
- [ ] Jira version marked as "Released"

## Post-deploy verification

After every deployment, verify:

```bash
# 1. Health check
curl http://<env-url>/api/health
# → { "status": "ok" }

# 2. Version check
curl http://<env-url>/api/version
# → { "version": "0.3.0-rc.1", "commit": "abc123", "environment": "test", "deployed_at": "..." }

# 3. Bandeau check
# Open the UI → verify the environment banner color matches
```

## Hotfix process

```bash
# 1. Create hotfix branch
git checkout -b hotfix/STN-XX-description main

# 2. Fix + TDD (Red → Green → Blue)
# 3. PR → merge to main
# 4. Tag patch
git tag v0.X.1
git push origin v0.X.1

# 5. Deploy to prod
# → Actions → CD - Deploy → env: prod, version: v0.X.1
```

## Manual fallback (SSH)

If GitHub Actions is down or the runner is offline:

```bash
ssh antony-server
cd /opt/stacknest
./infra/scripts/env.sh dev up      # or test/preview/prod
```

## Rollback

```bash
# Deploy the previous version
# → Actions → CD - Deploy → env: prod, version: v0.X-1.0
```
