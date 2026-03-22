#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

rm -f next-env.d.ts
rm -rf .next

npm run setup
npm run types:check
