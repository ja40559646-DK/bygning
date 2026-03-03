#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-$ROOT_DIR/export}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
REPO_NAME="$(basename "$ROOT_DIR")"

mkdir -p "$OUT_DIR"

BUNDLE_PATH="$OUT_DIR/${REPO_NAME}-${TIMESTAMP}.bundle"
ARCHIVE_PATH="$OUT_DIR/${REPO_NAME}-${TIMESTAMP}.tar.gz"
MANIFEST_PATH="$OUT_DIR/${REPO_NAME}-${TIMESTAMP}.manifest.txt"

(
  cd "$ROOT_DIR"
  git bundle create "$BUNDLE_PATH" --all
  git archive --format=tar.gz --output "$ARCHIVE_PATH" HEAD
)

{
  echo "Bygning eksport"
  echo "Generated: $(date -Iseconds)"
  echo "Repository: $REPO_NAME"
  echo "Git branch: $(git -C "$ROOT_DIR" branch --show-current)"
  echo "Head commit: $(git -C "$ROOT_DIR" rev-parse HEAD)"
  echo ""
  echo "Artifacts:"
  echo "- Git bundle (fuld historik + branches): $BUNDLE_PATH"
  echo "- Source archive (snapshot af HEAD): $ARCHIVE_PATH"
  echo ""
  echo "GitHub import (fuld historik):"
  echo "1) mkdir import-${REPO_NAME} && cd import-${REPO_NAME}"
  echo "2) git clone \"$BUNDLE_PATH\" $REPO_NAME"
  echo "3) cd $REPO_NAME"
  echo "4) git remote add origin https://github.com/<din-bruger>/<repo>.git"
  echo "5) git push -u origin --all"
  echo "6) git push origin --tags"
  echo ""
  echo "Alternativ: upload kun snapshot med tar.gz uden historik."
} > "$MANIFEST_PATH"

echo "Eksport klar:"
echo "- $BUNDLE_PATH"
echo "- $ARCHIVE_PATH"
echo "- $MANIFEST_PATH"
