#!/usr/bin/env bash
# Run all Supabase Edge Function Deno tests.
# Exits non-zero on the first failing test so CI fails the build.
set -euo pipefail

VERBOSE=0
for arg in "$@"; do
  case "$arg" in
    -v|--verbose) VERBOSE=1 ;;
    -h|--help)
      echo "Usage: $0 [--verbose]"
      echo "  -v, --verbose   Show full Deno output (disables quiet mode, enables trace logging)"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

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

DENO_ARGS=(test --allow-net --allow-env --allow-read --no-check)
if [ "$VERBOSE" -eq 1 ]; then
  echo "Verbose mode enabled (full Deno output, trace logging)."
  DENO_ARGS+=(--log-level=debug --trace-leaks)
fi

exec deno "${DENO_ARGS[@]}" "${TEST_FILES[@]}"