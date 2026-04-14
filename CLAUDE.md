# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StackNest is a deployment UI that proxies requests to n8n webhooks. It consists of two Docker services: a Node.js/Express API backend and a vanilla HTML/CSS/JS frontend served by Nginx.

The entire UI is in **French** — all labels, text, and user-facing strings must remain in French.

## Commands

```bash
# Build and run (from repo root)
docker compose up --build

# Run detached
docker compose up -d --build

# Stop
docker compose down

# Check API health
curl http://localhost:8080/api/health
```

The app is accessible at http://localhost:8080. There are no test suites, linters, or build steps configured.

## Environment

Copy `.env.example` to `.env` before running. Required variable: `N8N_WEBHOOK_URL`. Optional: `N8N_TOKEN`, `PORT` (default 3001), `DEBUG_ENV` (0/1).

## Architecture

**api/** — Single-file Express server (`server.js`). Validates incoming `{ template, count }` payloads and proxies them to the n8n webhook URL. Uses AbortController with a 15s timeout. No build step, no framework beyond Express.

**ui/** — Static files (index.html, app.js, styles.css) served by Nginx. Nginx also reverse-proxies `/api/` requests to the Express backend (stripping the prefix). No bundler, no npm — just plain browser JS.

**docker-compose.yml** — Two services: `api` (Node 20 Alpine, port 3001 internal) and `ui` (Nginx Alpine, port 8080 exposed). The UI service depends on API health check before starting.

## API Contract

- `GET /api/health` → `{ "ok": true }`
- `POST /api/deploy` → proxies to n8n webhook. Body: `{ "template": string, "count": integer >= 1 }`. Returns n8n response or error (400/500/502).
- `GET /debug/env` → env debug info (only when `DEBUG_ENV=1`)
