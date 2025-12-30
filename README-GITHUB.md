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
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
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
