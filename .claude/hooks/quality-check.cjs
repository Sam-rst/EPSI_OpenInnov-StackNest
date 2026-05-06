#!/usr/bin/env node
/**
 * StackNest — Claude Code quality hook (BLOQUANT)
 *
 * Modes :
 *   --mode=post-edit  → check rapide (lint+typecheck) sur le scope concerné par le fichier édité.
 *                       Lit le payload JSON sur stdin (tool_input.file_path).
 *   --mode=stop       → check rapide global avant de laisser Claude terminer un tour.
 *
 * Conventions :
 *   - exit 0 : OK, silencieux.
 *   - exit 2 : KO, message en stderr → Claude voit l'erreur et la traite.
 *
 * Délègue aux orchestrateurs frameworks :
 *   - Backend  : uv run poe lint && uv run poe typecheck
 *   - Frontend : npm run typecheck && npm run lint
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const mode = (args.find((a) => a.startsWith('--mode=')) || '').split('=')[1] || 'stop';

function readStdin() {
  try {
    const data = fs.readFileSync(0, 'utf8');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function blockWith(message) {
  process.stderr.write(`\n❌ StackNest quality gate (${mode}) — bloqué.\n${message}\nVoir CLAUDE.md > Definition of Done.\n`);
  process.exit(2);
}

function runApiCheck() {
  try {
    execSync('uv run poe lint && uv run poe typecheck', {
      cwd: path.resolve('apps/api'),
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (err) {
    blockWith(
      `Backend (apps/api) — lint/typecheck rouge.\n${err.stdout || ''}\n${err.stderr || ''}`,
    );
  }
}

function runWebCheck() {
  try {
    execSync('npm run typecheck && npm run lint', {
      cwd: path.resolve('apps/web'),
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (err) {
    blockWith(
      `Frontend (apps/web) — typecheck/lint rouge.\n${err.stdout || ''}\n${err.stderr || ''}`,
    );
  }
}

function runStopCheck() {
  // Sur Stop, on lance les deux scopes (les changements peuvent être éparpillés).
  // Skip silencieux si apps/* n'existe pas (early dev).
  if (fs.existsSync(path.resolve('apps/api/pyproject.toml'))) runApiCheck();
  if (fs.existsSync(path.resolve('apps/web/package.json'))) runWebCheck();
}

function runPostEditCheck() {
  const payload = readStdin();
  const filePath = payload?.tool_input?.file_path || '';
  if (!filePath) return; // rien à checker

  const isPy = /\.py$/i.test(filePath);
  const isTs = /\.(ts|tsx)$/i.test(filePath);
  const inApi = /apps[\\/]api[\\/]/i.test(filePath);
  const inWeb = /apps[\\/]web[\\/]/i.test(filePath);

  if (isPy && inApi) runApiCheck();
  else if (isTs && inWeb) runWebCheck();
  // Autres fichiers (docs, configs) → skip silencieux.
}

try {
  if (mode === 'post-edit') runPostEditCheck();
  else if (mode === 'stop') runStopCheck();
  else {
    process.stderr.write(`Mode inconnu: ${mode}\n`);
    process.exit(1);
  }
  process.exit(0);
} catch (err) {
  // Erreur inattendue dans le hook → log mais ne bloque pas (sinon Claude paralysé).
  process.stderr.write(`⚠️  Hook quality-check exception (non-bloquant) : ${err.message}\n`);
  process.exit(0);
}
