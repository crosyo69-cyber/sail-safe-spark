#!/usr/bin/env bash
# Run all Supabase Edge Function Deno tests.
# Exits non-zero on the first failing test so CI fails the build.
set -euo pipefail

if ! command -v deno >/dev/null 2>&1; then
  echo "::error::deno not found on PATH. Install Deno >= 1.44 before running edge function tests." >&2
  exit 127
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TEST_GLOB="${ROOT_DIR}/supabase/functions/**/*_test.ts ${ROOT_DIR}/supabase/functions/**/*.test.ts"

# Collect actual test files (avoid Deno globbing differences).
mapfile -t TEST_FILES < <(find "${ROOT_DIR}/supabase/functions" \
  -type f \( -name '*_test.ts' -o -name '*.test.ts' \) | sort)

if [ "${#TEST_FILES[@]}" -eq 0 ]; then
  echo "No edge function tests found under supabase/functions/." >&2
  exit 0
fi

echo "Running ${#TEST_FILES[@]} edge function test file(s):"
printf '  - %s\n' "${TEST_FILES[@]}"

exec deno test \
  --allow-net \
  --allow-env \
  --allow-read \
  --no-check \
  "${TEST_FILES[@]}"