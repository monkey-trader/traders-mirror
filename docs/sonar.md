# SonarCloud in CI

This repository supports running SonarCloud analysis from CI. To enable it, follow these steps:

1. Create a SonarCloud token:
   - Go to https://sonarcloud.io → My Account → Security → Generate Tokens
   - Copy the generated token (you will not be able to view it again)

2. GitHub repository secrets (Settings → Secrets and variables → Actions) - add the following secrets:
   - `SONAR_TOKEN` — the token you generated in SonarCloud
   - `SONAR_PROJECT_KEY` — project key (matches `sonar.projectKey` in `sonar-project.properties`)
   - `SONAR_ORGANIZATION` — your SonarCloud organization
   - `ENABLE_SONAR_CI` — set to `true` to enable Sonar runs from CI

3. Notes:
   - If SonarCloud "Automatic Analysis" is enabled for this project (via the SonarCloud GitHub App), you'll get an error if you run CI analysis concurrently. Disable Automatic Analysis in SonarCloud or don't set `ENABLE_SONAR_CI` to `true`.
   - The CI workflow reads coverage from `coverage/lcov.info` and vitest produces that file by default when running with coverage enabled.

If you want me to enable Sonar in CI now, set the above secrets and I'll re-run the analysis flow (or you can push a small commit to trigger CI).
