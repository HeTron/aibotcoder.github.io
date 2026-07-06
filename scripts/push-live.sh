#!/usr/bin/env bash
# Push aibotcoder-deploy AND verify GitHub Pages actually served it.
# Known failure (2026-07-05): the Pages build queue can hang on "building" for
# a stale commit — new files then 404 indefinitely until a rebuild is kicked.
# This script pushes, polls the build API, kicks ONE rebuild if stuck, and
# only exits 0 once the live build matches HEAD.
#
# Usage: ./scripts/push-live.sh          (from anywhere; commits must exist)
set -euo pipefail

REPO="HeTron/aibotcoder.github.io"
cd "$(dirname "$0")/.."

git push
SHA=$(git rev-parse --short HEAD)
echo "pushed $SHA — waiting for Pages build…"

KICKED=0
for i in $(seq 1 15); do
  STATUS_COMMIT=$(gh api "repos/$REPO/pages/builds/latest" --jq '.status + " " + .commit[0:7]')
  STATUS="${STATUS_COMMIT%% *}"; COMMIT="${STATUS_COMMIT##* }"
  echo "  [$i] build: $STATUS ($COMMIT)"
  if [ "$STATUS" = "built" ] && [ "$COMMIT" = "$SHA" ]; then
    echo "✅ Pages build live for $SHA"
    exit 0
  fi
  # After ~80s without our commit going live, assume the queue is hung and
  # kick one rebuild (harmless if a build is genuinely in progress).
  if [ "$i" -eq 4 ] && [ "$KICKED" -eq 0 ]; then
    echo "  build queue looks stuck — kicking a rebuild"
    gh api -X POST "repos/$REPO/pages/builds" >/dev/null
    KICKED=1
  fi
  sleep 20
done

echo "⚠ Pages build still not serving $SHA after ~5 min." >&2
echo "  Inspect: gh api repos/$REPO/pages/builds/latest" >&2
exit 1
