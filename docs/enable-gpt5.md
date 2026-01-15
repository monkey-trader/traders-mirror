# Enabling GPT-5 for Clients (operational guide)

This repository does not control entitlement to provider-side models. Enabling GPT-5 for clients requires two parts:

1) Provider entitlement & account-side steps
- Request or enable GPT-5 access from your OpenAI / provider account. This is a provider-level change and typically requires contacting sales or enabling a feature flag in the provider dashboard.
- Ensure the account billing and quotas are sufficient for GPT-5 usage.

2) Deployment & secret configuration (repository / CI)
- Add or update the repository secret used by your runtime/CI with the OpenAI API key and, optionally, set the desired model name via `OPENAI_MODEL`.
- Example GitHub Actions secrets:
  - `OPENAI_API_KEY` — the API key for the provider account.
  - `OPENAI_MODEL` — the model name to use (e.g., `gpt-5`).

Example steps (GitHub):

1. In the repo, go to "Settings → Secrets and variables → Actions → New repository secret".
2. Create `OPENAI_API_KEY` and paste your provider API key.
3. Create `OPENAI_MODEL` and set value to `gpt-5` (or the exact model name provided).
4. Update any runtime environment (.env on server, or secret in platform) to include the same variables.

Code-side support in this repo
- This repository includes a configuration stub at `src/infrastructure/openai/config.ts` that reads `process.env.OPENAI_MODEL`.
- If you want to switch models, set `OPENAI_MODEL` in your environment or CI secrets and redeploy.

Security and rollout notes
- Roll out gradually — consider a feature flag and canary deployment to limit blast radius.
- Monitor cost and latency after switching to GPT-5; higher-capacity models may be slower and more expensive.
- Make sure the provider key is scoped appropriately and rotated regularly.

If you want, I can also prepare a small feature-flag implementation (runtime + UI toggle) and wire CI to deploy with the new secrets. Confirm and I will proceed.
