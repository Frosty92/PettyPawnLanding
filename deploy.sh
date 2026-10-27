#!/usr/bin/env bash
# Deploys the landing page to Cloudflare Pages (project pettypawn-landing, served on pettypawn.com).
# Only the page and its assets are uploaded; capture/, brand/ and the README stay out.
set -euo pipefail
cd "$(dirname "$0")"
OUT="$(mktemp -d)"
cp index.html styles.css main.js "$OUT/"
cp -R assets "$OUT/assets"
npx wrangler pages deploy "$OUT" --project-name pettypawn-landing --branch main --commit-dirty=true
