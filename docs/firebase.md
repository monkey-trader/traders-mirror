# Firebase Setup

This app uses Firebase Authentication (Google provider) from the browser (no backend).

## 1) Create a Firebase Web App
- Firebase Console → Project Settings → Your Apps → Web → Register App
- Copy the config (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

## 2) Enable Google Sign-In
- Firebase Console → Build → Authentication → Sign-in method → Enable Google.

## 3) Authorized Domains
Add both domains:
- `localhost` (for local dev)
- `monkey-trader.github.io` (GitHub Pages)

Optional: If you run the app under a custom domain, add it here as well.

## 4) Local Development
Create `.env.local` in the repo root based on `.env.local.example`:

```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

Alternatively, if you build/run with Vite, use the Vite-prefixed variables (supported by the codebase as well):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Start the app:

```bash
npm start
```

## 5) CI/CD Secrets/Variables (GitHub Pages)
Set repository Variables (preferred) or Secrets under:
- GitHub → Repo → Settings → Secrets and variables → Actions → Variables

Create these variables (for CRA builds used by this repo's workflow):
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

If you switch to a Vite build pipeline, set the corresponding `VITE_*` variables instead:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

The workflow `.github/workflows/deploy-pages.yml` injects the `REACT_APP_*` variables at build time. The runtime code supports both styles, so either set is valid depending on your build tool.

## 6) Deploy to GitHub Pages
Use the manual workflow described in `docs/deploy.md` (Actions → Deploy Pages (manual)).

After deploy, your app is available at:
- `https://monkey-trader.github.io/traders-mirror/`

## Troubleshooting
- "Firebase config missing env vars": Ensure `.env.local` (dev) or GitHub Variables (CI) are set.
- "Popup blocked": Allow popups for your dev page/domain.
- "auth/operation-not-allowed": Enable Google provider under Authentication → Sign-in method.
- Stuck on Loading: Check the browser console for `AuthProviderError` messages.
