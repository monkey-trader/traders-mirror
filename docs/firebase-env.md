# Firebase Environment Setup

This app reads Firebase configuration from both CRA-style (`REACT_APP_*`) and Vite-style (`VITE_*`) environment variables. The deploy workflow maps `REACT_APP_*` values to `VITE_*` automatically if you only provide the former.

## Required Variables

Set the following as Repository Variables in GitHub (Settings → Secrets and variables → Actions → Variables):

- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

Optional (for Vite-style builds):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

If you omit the `VITE_*` variables, the deploy job maps the `REACT_APP_*` ones to `VITE_*` automatically.

## Local Development

- Copy `.env.example` to `.env.local` and fill in your Firebase project values.
- The app and tests will pick up `.env.local` automatically.

## Firebase Console

- In Firebase Console → Authentication → Settings → Authorized domains, add your Pages domain: `monkey-trader.github.io`.

## Deploy Workflow Behavior

- The job-level environment maps Variables/Secrets into both `REACT_APP_*` and `VITE_*` keys.
- A debug step prints whether each expected Firebase env is set (values are hidden). Ensure all show as `set`.
- Build metadata keys (`REACT_APP_BUILD_*` and `VITE_BUILD_*`) are exported so the Settings page can display branch/commit info.