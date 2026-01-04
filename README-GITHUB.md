# traders-mirror

This repository uses **GitHub branch protection** to enforce a safe workflow on the `main` branch.

All changes must go through **Pull Requests**; direct pushes are blocked.

---

## 🔒 Branch Protection: `main`

The `main` branch is protected with the following rules:

- ❌ No direct pushes  
- ❌ No force pushes  
- ❌ No branch deletions  
- ❌ Admins cannot bypass rules  
- ✅ Pull requests required  
- ✅ At least **1 approving review**  
- ✅ Stale reviews dismissed on new commits  
- ✅ Linear history required  

---

## 🛠 Setup Branch Protection (GitHub CLI)

Branch protection was configured using **GitHub CLI (`gh`)** and the REST API.

### 1. Create a JSON configuration

```bash
cat > branch-protection.json <<'EJSON'
{
  "required_status_checks": {
    "strict": false,
    "contexts": []
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "bypass_pull_request_allowances": {
      "users": [],
      "teams": [],
      "apps": []
    }
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EJSON
```

### 2. Apply branch protection to `main`

```bash
gh api \
  --method PUT \
  repos/monkey-trader/traders-mirror/branches/main/protection \
  --input branch-protection.json
```

### 3. Verify branch protection

```bash
gh api repos/monkey-trader/traders-mirror/branches/main/protection
```

You should see output including:

- `"required_pull_request_reviews"`
- `"enforce_admins.enabled": true`
- `"allow_force_pushes.enabled": false`
- `"allow_deletions.enabled": false`

---

## 🧪 Test Protection Locally

Try pushing directly to `main`:

```bash
git checkout main
git commit --allow-empty -m "test protected branch"
git push origin main
```

Expected result:

```
remote: error: GH006: Protected branch update failed
```

---

## ✅ Recommended Workflow

1. Create a feature branch:

```bash
git checkout -b feature/my-change
```

2. Push branch to GitHub:

```bash
git push -u origin feature/my-change
```

3. Open a Pull Request:

```bash
gh pr create
```

All changes must go through a PR before merging to `main`.

---

## 📌 Notes

- GitHub’s branch protection API requires **boolean values in requests** but returns **object values in responses** (e.g., `{ "enabled": true }`).  
- Using a JSON file is the most reliable way to manage protection rules.  
- This setup can be reused across multiple repositories.

---

## 🔜 Optional Enhancements

- Require **GitHub Actions checks** before merge  
- Enforce **CODEOWNERS reviews**  
- Restrict pushes to **bots only**  
- Automate branch protection across **all repositories**


## Workflow Integration

### Create a Pull Request with GitHub CLI
```bash
gh pr create --title "chore: update README" --body "Add Github CLI commands"
```

### List Open Pull Requests
```bash
gh pr list
```

### View a Pull Request
```bash
gh pr view <PR_NUMBER>
```
## Approve a Pull Request
```bashbash
gh pr review <PR_NUMBER> --approve --body "LGTM! Looks good to merge."
```


### Merge a Pull Request with GitHub CLI
```bash
gh pr merge <PR_NUMBER> --squash --delete-branch
```

### Envorcement of Branch Protection Rules
```bash
gh pr merge <PR_NUMBER> --squash --delete-branch --admin
```

## GitHub Actions & GH CLI (useful commands)

Below are concrete `gh` and `git` commands that are useful when inspecting, re-running, or triggering GitHub Actions workflows — examples shown use the repository `monkey-trader/traders-mirror` and assume the `gh` CLI is authenticated and configured.

- List recent workflow runs for the repo:
```bash
gh run list --repo monkey-trader/traders-mirror --limit 20
```

- Show details (metadata) for a specific run (replace `<run-id>`):
```bash
gh run view <run-id> --repo monkey-trader/traders-mirror --json databaseId,conclusion,status,event,headBranch,headSha,name,createdAt
```

- Fetch the full log for a run (or job) to inspect errors:
```bash
gh run view <run-id> --repo monkey-trader/traders-mirror --log
# or view only failed step logs
gh run view <run-id> --repo monkey-trader/traders-mirror --log-failed
```

- Re-run a previously completed/failed run:
```bash
gh run rerun <run-id> --repo monkey-trader/traders-mirror
```

- Watch a run until it completes (stream output):
```bash
gh run watch <run-id> --repo monkey-trader/traders-mirror
```

- Trigger a workflow dispatch (run a workflow file) on a specific branch with inputs:
```bash
gh workflow run deploy-pages.yml --ref fix-deploy -f source=pages -f source_branch=fix-deploy -f use_artifact=false -f force=false --repo monkey-trader/traders-mirror
```

- Trigger a workflow by name (example: Lint) on a branch:
```bash
gh workflow run Lint --repo monkey-trader/traders-mirror --ref fix-deploy
```

- List runs for a specific workflow file:
```bash
gh run list --workflow=deploy-pages.yml --repo monkey-trader/traders-mirror --limit 10
```

- Useful git commands executed during deploy or debugging:
```bash
# fetch a remote branch and check it out locally
git fetch origin fix-deploy
git checkout -B deploy-source origin/fix-deploy

# stage, commit and push local changes
git add <paths>
git commit -m "chore: message"
git push origin fix-deploy
```

Notes:
- Use `--repo owner/repo` when running `gh` commands from outside the repository folder.
- Replace `<run-id>` and branch names with the actual values from your project.
- Many `gh` commands accept `--json` to extract structured fields useful for automation.

