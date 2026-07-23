#!/bin/bash
# Sync diary markdown files from recap_service/market_diary into this repo,
# since Cloudflare Pages builds only see files committed to this Git repo
# (the old symlink approach doesn't survive a remote clone).
set -euo pipefail

SRC="../recap_service/market_diary"
DEST="src/content/diary"

cd "$(dirname "$0")/.."

if [ ! -d "$SRC" ]; then
  echo "Source directory not found: $SRC" >&2
  exit 1
fi

rsync -av --include='*/' --include='*.md' --exclude='*' "$SRC/" "$DEST/"

echo "Synced. Review changes with: git status src/content/diary"
