#!/bin/sh
# scripts/wiki-hook.sh — post-commit NOTIFIER for the code wiki.
# Runs the two deterministic signals so you know when to run /wiki-update:
#   1. scripts/wiki-drift.sh    — code changed since wiki/.state.json's checkpoint
#   2. scripts/wiki-coverage.sh — tracked code no page's `sources` claims
# Both are plain git + grep, silent when clean. This hook NEVER calls an LLM,
# never edits anything, never fails the commit.
#
# Install:  ln -sf ../../scripts/wiki-hook.sh .git/hooks/post-commit
#       or  cp scripts/wiki-hook.sh .git/hooks/post-commit && chmod +x .git/hooks/post-commit

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -f "$root/wiki/.state.json" ] || exit 0        # no wiki yet — nothing to nag about
cd "$root" || exit 0

[ -f scripts/wiki-drift.sh ]    && sh scripts/wiki-drift.sh
[ -f scripts/wiki-coverage.sh ] && sh scripts/wiki-coverage.sh

exit 0
