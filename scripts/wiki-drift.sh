#!/bin/sh
# scripts/wiki-drift.sh — deterministic wiki STALENESS signal. Silent when up to date.
# Reads the checkpoint from wiki/.state.json (last_indexed_commit) and counts the
# commits / code files since, excluding wiki/.wikiignore patterns. git only, no LLM.
STATE="wiki/.state.json"
IGNORE="wiki/.wikiignore"
root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root" || exit 0
[ -f "$STATE" ] || exit 0

LAST=$(sed -n 's/.*"last_indexed_commit": *"\([a-f0-9]*\)".*/\1/p' "$STATE")
[ -n "$LAST" ] || exit 0
git cat-file -e "$LAST" 2>/dev/null || exit 0

N=$(git rev-list --count "$LAST"..HEAD 2>/dev/null) || exit 0
[ "$N" -gt 0 ] || exit 0

set -- .
if [ -f "$IGNORE" ]; then
    while IFS= read -r pattern; do
        case "$pattern" in ''|\#*) continue ;; esac
        set -- "$@" ":(exclude)$pattern"
    done < "$IGNORE"
fi
FILES=$(git diff --name-only "$LAST"..HEAD -- "$@" | grep -c .)
[ "$FILES" -gt 0 ] || exit 0

echo "wiki: $N commit(s) not indexed ($FILES code file(s)) since $(printf '%.7s' "$LAST") -> /wiki-update"
