#!/bin/sh
# scripts/wiki-lint.sh — enforce wiki/CONVENTIONS.md. Plain git + grep + awk, no LLM.
# Fails (exit 1) if any page is missing a required key, points at a source that no
# longer exists, or is stale (a source changed after the page's synced SHA).

root=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "wiki-lint: not a git repo"; exit 1; }
cd "$root" || exit 1
[ -d wiki ] || { echo "wiki-lint: no wiki/ yet — run wiki-init"; exit 0; }

fail=0
req="title type responsibility sources updated synced"
pages=$(find wiki -name '*.md' ! -name index.md ! -name log.md ! -name CONVENTIONS.md)

for f in $pages; do
  for k in $req; do
    grep -q "^$k:" "$f" || { echo "MISSING $k -> $f"; fail=1; }
  done

  synced=$(awk -F': *' '/^synced:/{print $2; exit}' "$f" | tr -d ' ')
  [ -n "$synced" ] || continue

  # extract the sources: YAML block (lines "  - path" until the next top-level key)
  srcs=$(awk '
    /^sources:/ { cap=1; next }
    cap && /^[a-zA-Z_]+:/ { cap=0 }
    cap && /^[[:space:]]*-[[:space:]]*/ { sub(/^[[:space:]]*-[[:space:]]*/,""); print }
  ' "$f")

  for s in $srcs; do
    if [ ! -e "$s" ]; then
      echo "ORPHAN source '$s' -> $f"; fail=1; continue
    fi
    if [ -n "$(git diff --name-only "$synced" HEAD -- "$s" 2>/dev/null)" ]; then
      echo "STALE  '$s' changed since $synced -> $f (run /wiki-update)"; fail=1
    fi
  done
done

if [ "$fail" = 0 ]; then
  echo "wiki-lint: OK ($(printf '%s\n' "$pages" | grep -c .) pages)"
fi
exit $fail
