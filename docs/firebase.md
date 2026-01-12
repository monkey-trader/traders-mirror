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

To enable Cloud Sync capability in the deployed build, set the workflow input `use_firebase` to `true` when triggering the deploy:

- Actions → Deploy Pages (manual) → set `use_firebase: true`.
- Ensure repository Variables or Secrets provide the Firebase config keys (CRA or Vite style are both supported by the workflow):
	- CRA: `REACT_APP_FIREBASE_API_KEY`, `REACT_APP_FIREBASE_AUTH_DOMAIN`, `REACT_APP_FIREBASE_PROJECT_ID`, `REACT_APP_FIREBASE_STORAGE_BUCKET`, `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`, `REACT_APP_FIREBASE_APP_ID`
	- Vite: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`

The workflow wires `use_firebase` into both `REACT_APP_USE_FIREBASE` and `VITE_USE_FIREBASE` so the Settings toggle becomes available after deploy (provided the config keys are set).

## Troubleshooting
- "Firebase config missing env vars": Ensure `.env.local` (dev) or GitHub Variables (CI) are set.
- "Popup blocked": Allow popups for your dev page/domain.
- "auth/operation-not-allowed": Enable Google provider under Authentication → Sign-in method.
- Stuck on Loading: Check the browser console for `AuthProviderError` messages.

## Firestore Repositories (Trades & Analyses)

This project includes Firestore-backed repositories in the Infrastructure layer:

- `src/infrastructure/trade/repositories/FirebaseTradeRepository.ts`
- `src/infrastructure/analysis/repositories/FirebaseAnalysisRepository.ts`

Two modes are supported:

- Offline-first (default): LocalStorage as primary store with background sync to Firestore when online/authenticated.
- Local-only: No Firebase configured, everything stays in LocalStorage.

Enable Firestore sync via environment flag (or by presence of config):

```
VITE_USE_FIREBASE=true
# or CRA style
REACT_APP_USE_FIREBASE=true
```

When enabled, the app will sync user-scoped documents in Firestore collections (LocalStorage remains the immediate UI source of truth). The app also treats the presence of Firebase config keys as enabling capability, even if the explicit `USE_FIREBASE` flag is missing:

- `trades/{id}` with a required `userId` field
- `analyses/{id}` with a required `userId` field

Security Rules example:

```
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		match /trades/{tradeId} {
			allow read: if isOwner(resource.data);
			allow create: if isOwner(request.resource.data);
			allow update, delete: if isOwner(resource.data);
		}
		match /analyses/{analysisId} {
			allow read: if isOwner(resource.data);
			allow create: if isOwner(request.resource.data);
			allow update, delete: if isOwner(resource.data);
		}
		function isOwner(data) {
			return request.auth != null && data.userId == request.auth.uid;
		}
	}
}
```

Notes:
- UI reads from LocalStorage; writes are persisted locally first and then synced to Firestore.
- If offline or unauthenticated, changes queue in an outbox and sync automatically when you come back online.
- Tests and local development default to LocalStorage-only unless `USE_FIREBASE` is enabled.
- In test runs (`NODE_ENV=test`), Firestore adapters are disabled to keep deterministic tests.

## Cloud Sync Toggle (Settings)

You can control Firebase sync at runtime via the Settings page.

- Availability: The toggle becomes available when either an env flag enables Firebase capability or when Firebase config keys are present.
	- Preferred: provide the Firebase config variables (`*_API_KEY`, `*_AUTH_DOMAIN`, `*_PROJECT_ID`, `*_STORAGE_BUCKET`, `*_MESSAGING_SENDER_ID`, `*_APP_ID`). If these exist, capability is enabled by default.
	- Optional flags: `VITE_USE_FIREBASE=true` (Vite) or `REACT_APP_USE_FIREBASE=true` (CRA). These explicitly enable capability when config keys are also present.
	- Without config, the toggle shows "Unavailable" and the app stays local-only.
- Preference: The switch persists `useCloudSync` in `localStorage` (`mt_user_settings_v1`).
	- Enabled → Hybrid repositories attach Firestore and sync in the background.
	- Disabled → Hybrid repositories run local-only even if env flags are present.
- Status: The header shows a small badge (RepoSyncStatus) summarizing state:
	- `Sync: Local` — local-only mode
	- `Sync: Online` — remote available, no queued items
	- `Sync: Queued N` — N items waiting to sync
- Auth: Sign in (Google) to allow per-user reads/writes. Rules require `userId == auth.uid`.
- Code references:
	- Composition root selection: `src/App.tsx` and `src/presentation/analysis/Analysis.tsx` read env flags and `useCloudSync`.
	- Firebase init: `src/infrastructure/firebase/client.ts` supports both CRA and Vite env styles.
