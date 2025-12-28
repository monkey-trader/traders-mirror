#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   1) Save as scripts/set-sonar-secret-and-trigger.sh
#   2) chmod +x scripts/set-sonar-secret-and-trigger.sh
#   3) ./scripts/set-sonar-secret-and-trigger.sh
#
# Requirements:
#   - gh (GitHub CLI) installed and authenticated with a user that can set repo secrets
#   - git configured & able to push to origin/main
#   - network access to GitHub
#
# This script reads your SonarCloud token interactively (no echo), sets the GitHub secret,
# optionally sets SONAR_PROJECT_KEY/SONAR_ORGANIZATION, pushes an empty commit to trigger CI,
# waits for the resulting run, streams logs and downloads artifacts into ./artifacts.

REPO="monkey-trader/traders-mirror"
DEFAULT_PROJECT_KEY="monkey-trader_traders-mirror"
DEFAULT_ORGANIZATION="monkey-trader"
ARTIFACT_DIR="./artifacts"

command -v gh >/dev/null 2>&1 || { echo "gh CLI not found. Install from https://cli.github.com/ and authenticate (gh auth login)."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "git not found. Install git."; exit 1; }

echo "Repo target: $REPO"
echo "This script will set SONAR_TOKEN in the repository $REPO and trigger a CI run on main."
echo "You must have push and repo:admin or repo:maintain rights for $REPO and GH CLI authentication."

# Read Sonar token silently
read -r -p "Proceed? (y/N): " proceed
if [ "${proceed,,}" != "y" ]; then
  echo "Aborted by user."
  exit 0
fi

echo -n "Paste SonarCloud token (it will not be shown): "
read -r -s SONAR_TOKEN
echo
if [ -z "$SONAR_TOKEN" ]; then
  echo "No token provided — aborting."
  exit 1
fi

# Optionally set project key & org (we default to sonar-project.properties values)
read -r -p "Set SONAR_PROJECT_KEY? (default: $DEFAULT_PROJECT_KEY) (enter to accept): " provided_pk
SONAR_PROJECT_KEY="${provided_pk:-$DEFAULT_PROJECT_KEY}"
read -r -p "Set SONAR_ORGANIZATION? (default: $DEFAULT_ORGANIZATION) (enter to accept): " provided_org
SONAR_ORGANIZATION="${provided_org:-$DEFAULT_ORGANIZATION}"

echo "Setting secrets in GitHub repo $REPO ..."
# Set secrets using gh CLI
# NOTE: gh secret set will prompt for MFA if needed for your account
gh secret set SONAR_TOKEN --body "$SONAR_TOKEN" --repo "$REPO"
echo "SONAR_TOKEN set."

# Optional: set project key and org as secrets (not strictly necessary but convenient)
gh secret set SONAR_PROJECT_KEY --body "$SONAR_PROJECT_KEY" --repo "$REPO" || true
gh secret set SONAR_ORGANIZATION --body "$SONAR_ORGANIZATION" --repo "$REPO" || true

echo "SONAR_PROJECT_KEY and SONAR_ORGANIZATION set (or updated)."

# Trigger a CI run by pushing an empty commit to main
echo "Triggering CI run by pushing an empty commit to main..."
git fetch origin main
# ensure on main
if git rev-parse --abbrev-ref HEAD | grep -q "main"; then
  :
else
  git checkout main
fi

git pull --rebase origin main
git commit --allow-empty -m "ci: trigger rerun after setting SONAR_TOKEN [automation]" || true
git push origin main

# Wait a moment, then find the latest run for main
echo "Waiting a few seconds for GitHub Actions to register the run..."
sleep 4

# Get latest run id for main
RUN_ID=$(gh run list --repo "$REPO" --branch main --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)

if [ -z "$RUN_ID" ] || [ "$RUN_ID" = "null" ]; then
  echo "Could not determine run id immediately. Listing recent runs for manual selection:"
  gh run list --repo "$REPO" --limit 10
  echo "Please run: gh run watch <run-id> --repo $REPO"
  exit 0
fi

echo "Found run id: $RUN_ID — streaming logs now (this will block until run completes)..."
gh run watch "$RUN_ID" --repo "$REPO"

# After completion, save logs and download artifacts
LOGFILE="run_${RUN_ID}.log"
echo "Downloading logs to $LOGFILE ..."
gh run view "$RUN_ID" --repo "$REPO" --log > "$LOGFILE" || true

mkdir -p "$ARTIFACT_DIR"
echo "Downloading artifacts to $ARTIFACT_DIR ..."
gh run download "$RUN_ID" --repo "$REPO" --dir "$ARTIFACT_DIR" || true

echo
echo "=== SUMMARY ==="
echo "Run ID: $RUN_ID"
echo "Logs: $(realpath "$LOGFILE")"
echo "Artifacts dir: $(realpath "$ARTIFACT_DIR")"
echo
echo "Downloaded artifacts (if any):"
ls -la "$ARTIFACT_DIR" || echo "(no artifacts)"
echo
echo "If you want I can now analyze the run log and the artifacts for coverage and Sonar results."
echo "When you're ready, say 'done' here and I'll fetch and parse the logs, check for vitest-report.xml and .coverage/lcov.info, and verify whether SonarCloud analysis succeeded."

exit 0

