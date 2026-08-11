#!/bin/sh
# scripts/wiki-hook.sh — post-commit NOTIFIER for the code wiki.
# Runs the two deterministic debt signals so you know when to run /wiki-ingest:
#   drift    — code changed since wiki/.state.json's checkpoint, and pages whose
#              own `sources:` moved past their `synced:`
#   coverage — tracked code no page's `sources:` claims
# Both are silent when clean. This hook NEVER calls an LLM, never edits anything,
# never fails the commit. Integrity (`lint`) is a human's call, not a nag.
#
# Install:  ln -sf ../../scripts/wiki-hook.sh .git/hooks/post-commit
#       or  cp scripts/wiki-hook.sh .git/hooks/post-commit && chmod +x .git/hooks/post-commit

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -f "$root/wiki/.state.json" ] || exit 0        # no wiki yet — nothing to nag about
cd "$root" || exit 0
command -v node >/dev/null 2>&1 || exit 0
[ -f scripts/wiki/wiki.mjs ] || exit 0

node scripts/wiki/wiki.mjs drift 2>/dev/null
node scripts/wiki/wiki.mjs coverage 2>/dev/null

exit 0
