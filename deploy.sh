#!/usr/bin/env bash
# SUPERSEDED 2026-10-27: the Pages project is connected to GitHub and builds build.sh on every push to main, and a
# Git-connected project takes no direct uploads. Kept only for cleanup.
# Deployed the landing page and its waitlist API to Cloudflare Pages (project pettypawn-landing, served on pettypawn.com).
# It assembles site/ (the page and its assets), functions/ and wrangler.toml in a temporary folder and deploys from there,
# so capture/, brand/ and the README are never uploaded. Run it with `bash deploy.sh` from a terminal where `wrangler login`
# has been done.
set -euo pipefail
cd "$(dirname "$0")"
HASH="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
OUT="$(mktemp -d)"
mkdir "$OUT/site"
cp index.html styles.css main.js "$OUT/site/"
cp -R assets "$OUT/site/assets"
cp -R functions "$OUT/functions"
cp wrangler.toml "$OUT/"
cd "$OUT"
npx wrangler pages deploy --project-name pettypawn-landing --branch main --commit-hash "$HASH" --commit-dirty=true
