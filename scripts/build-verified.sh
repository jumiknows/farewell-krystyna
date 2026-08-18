#!/usr/bin/env bash
set -euo pipefail

echo "Building the Cloudflare Worker..."
npx vinext build

test -f dist/server/index.js || {
  echo "Build failed: dist/server/index.js was not created." >&2
  exit 1
}

echo "Cloudflare Worker build verified."
