#!/usr/bin/env bash
# Preflight for visual verification.
#
# Usage:
#   scripts/visual-verify.sh examples/src/datums/section-line.html
#   scripts/visual-verify.sh examples/src/datums/section-line.html --port 5555
#
# Exits 0 if the dev server is reachable and the example HTML file exists,
# and prints the canonical URL to screenshot. Exits non-zero otherwise with
# a message explaining what to do next.
#
# This script is consumed by agents (and humans) before using Playwright MCP
# to screenshot an example. It does NOT take the screenshot itself.

set -u

PORT="${PORT:-5555}"
EXAMPLE=""
VIEWPORT="1600x900"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    --viewport) VIEWPORT="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,15p' "$0"
      exit 0
      ;;
    *)
      if [[ -z "$EXAMPLE" ]]; then EXAMPLE="$1"; shift
      else echo "unexpected arg: $1" >&2; exit 2
      fi
      ;;
  esac
done

if [[ -z "$EXAMPLE" ]]; then
  echo "error: missing example path" >&2
  echo "usage: $0 <path under examples/src/...>" >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Normalize: accept either "examples/src/foo/bar.html" or "foo/bar.html" (assumed under examples/src/).
case "$EXAMPLE" in
  examples/src/*) REL="$EXAMPLE" ;;
  /*) REL="${EXAMPLE#$REPO_ROOT/}" ;;
  *) REL="examples/src/$EXAMPLE" ;;
esac

FULL="$REPO_ROOT/$REL"
if [[ ! -f "$FULL" ]]; then
  echo "error: example file not found: $FULL" >&2
  exit 3
fi

URL="http://localhost:$PORT/$REL"

# Probe the dev server. HEAD is enough; follow redirects in case vite serves via index.
if ! curl --silent --show-error --fail --max-time 3 --head "$URL" > /dev/null 2>&1; then
  echo "error: dev server not reachable at http://localhost:$PORT" >&2
  echo "       start it with:  npm run dev" >&2
  echo "       (or pass --port if it's on a different port)" >&2
  exit 4
fi

cat <<EOF
ok
url:       $URL
file:      $REL
viewport:  $VIEWPORT
ready:     wait for window.__OP_READY__ === true (or the 'openplans:ready' event)
EOF
