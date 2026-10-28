#!/usr/bin/env bash
# Builds site/, the folder Cloudflare Pages serves: the page, its scripts and assets, nothing else. Pages runs this on
# every push to main (project pettypawn-landing, connected to github.com/Frosty92/PettyPawnLanding) and reads functions/
# and wrangler.toml from the repo root, so capture/, brand/, migrations/ and the README never leave the repo.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf site
mkdir site
cp index.html styles.css main.js site/
cp -R assets site/assets
