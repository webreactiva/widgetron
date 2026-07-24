#!/bin/sh
# scripts/wiki-coverage.sh — deterministic wiki COVERAGE signal: tracked code files
# that no page's `sources` claims. The mirror of the drift/staleness check on the
# coverage axis. Silent when coverage is complete. Plain git + awk + comm, no LLM.
# Usage: sh scripts/wiki-coverage.sh [-v]   (-v also lists every unclaimed file)
WIKI="wiki"
IGNORE="$WIKI/.wikiignore"
VERBOSE="$1"
[ -d "$WIKI" ] || exit 0

# Every `sources` pattern across all wiki pages (first frontmatter block only).
PAGES=$(find "$WIKI" -name '*.md' ! -name index.md ! -name log.md ! -name CONVENTIONS.md)
[ -n "$PAGES" ] || exit 0
# shellcheck disable=SC2086
PATTERNS=$(awk '
    FNR == 1 { fm = 0; insrc = 0 }
    /^---[ \t]*$/ { fm++; insrc = 0; next }
    fm != 1 { next }
    /^sources:/ { insrc = 1; next }
    insrc && /^[ \t]+- / { sub(/^[ \t]+- +/, ""); print; next }
    { insrc = 0 }
' $PAGES 2>/dev/null | sort -u)
[ -n "$PATTERNS" ] || exit 0

# Indexable files: tracked minus .wikiignore.
set -- .
if [ -f "$IGNORE" ]; then
    while IFS= read -r pattern; do
        case "$pattern" in ''|\#*) continue ;; esac
        set -- "$@" ":(exclude)$pattern"
    done < "$IGNORE"
fi
INDEXABLE=$(git ls-files -- "$@" | sort -u)

# Files claimed by at least one page's sources.
set --
while IFS= read -r pattern; do
    [ -n "$pattern" ] && set -- "$@" "$pattern"
done <<EOF
$PATTERNS
EOF
COVERED_TMP=$(mktemp)
trap 'rm -f "$COVERED_TMP"' EXIT
git ls-files -- "$@" 2>/dev/null | sort -u > "$COVERED_TMP"

ORPHANS=$(printf '%s\n' "$INDEXABLE" | comm -23 - "$COVERED_TMP")
N=$(printf '%s\n' "$ORPHANS" | grep -c .)
[ "$N" -gt 0 ] || exit 0   # silent when coverage is complete

echo "wiki: $N tracked code file(s) unclaimed by any page's sources -> add pages via /wiki-update"
printf '%s\n' "$ORPHANS" | awk -F/ '
    { d = NF > 3 ? $1"/"$2"/"$3 : (NF > 1 ? substr($0, 1, length($0) - length($NF) - 1) : ".") ; c[d]++ }
    END { for (d in c) printf "%5d  %s\n", c[d], d }
' | sort -rn
if [ "$VERBOSE" = "-v" ]; then
    echo "--"
    printf '%s\n' "$ORPHANS"
fi
