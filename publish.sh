#!/bin/sh
# Publish today's Mise en Place edition by pushing it to the briefs branch (never main).
# Usage: MEP_SALT=... sh publish.sh YYYY-MM-DD [BRANCH]   (BRANCH defaults to briefs)
# Runs check.py first and refuses to push unless it prints PASSED. Builds one
# new commit whose tree is the branch tip plus this folder's briefs/ files
# only, and whose parent is the branch tip, so the push is a normal
# fast-forward (no force push). Then, for the briefs branch, waits for GitHub
# Pages to finish publishing and prints LIVE, or why not.
DATE="$1"; BRANCH="${2:-briefs}"
HERE="$(cd "$(dirname "$0")" && pwd)"
case "$BRANCH" in briefs|briefs-rehearsal) ;; *) echo "Refusing to push to $BRANCH"; exit 1 ;; esac
if [ -z "$MEP_SALT" ] && [ "$(TZ=Europe/London date +%Y%m%d)" -lt 20261111 ]; then
  # Grace period while the routine prompt is updated to pass MEP_SALT here.
  # GitHub's publish job still runs main's check.py before anything goes live.
  echo "WARNING: MEP_SALT is not set, so publish.sh could not run check.py itself"
elif [ -z "$MEP_SALT" ]; then
  echo "REFUSED: MEP_SALT is not set, so the edition cannot be checked. Run: MEP_SALT=... sh publish.sh $DATE"; exit 1
else
  OUT=$(python3 "$HERE/check.py" "$DATE" 2>&1)
  if [ "$(printf '%s\n' "$OUT" | tail -n 1)" != "PASSED" ]; then printf '%s\n' "$OUT"; echo "REFUSED: check.py did not pass, nothing pushed"; exit 1; fi
fi
git fetch -q origin briefs "$BRANCH" 2>/dev/null || git fetch -q origin briefs
PARENT=$(git rev-parse -q --verify "origin/$BRANCH" || git rev-parse origin/briefs)
IDX=$(mktemp); rm -f "$IDX"
GIT_INDEX_FILE="$IDX" git read-tree "$PARENT" && GIT_INDEX_FILE="$IDX" git add briefs && TREE=$(GIT_INDEX_FILE="$IDX" git write-tree)
rm -f "$IDX"
if [ -z "$TREE" ]; then echo "PUSH FAILED: could not build the commit"; exit 1; fi
COMMIT=$(git -c user.name="Mise en Place" -c user.email="mrbam-codes@users.noreply.github.com" commit-tree "$TREE" -p "$PARENT" -m "Edition $DATE")
START=$(date -u +%Y-%m-%dT%H:%M:%SZ)
if ! git push -q origin "$COMMIT:refs/heads/$BRANCH"; then echo "PUSH FAILED"; exit 1; fi
echo "PUSHED $COMMIT to $BRANCH at $START"
if [ "$BRANCH" = "briefs" ]; then sh "$HERE/live.sh" "$START"; fi
