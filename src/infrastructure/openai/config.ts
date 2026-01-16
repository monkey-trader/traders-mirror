// Small config helper to centralize OpenAI model selection.
// Set the `OPENAI_MODEL` environment variable in your runtime or CI to override.

export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

export function getOpenAIModel(): string {
  // In browser builds `process.env` is replaced by the bundler; ensure your build injects env vars.
  // For Node runtimes, `process.env.OPENAI_MODEL` will be read directly.
  // Use a fallback default so code behaves deterministically when unset.
  // Note: Enabling GPT-5 requires provider-side entitlement and a correct model name.
  const proc =
    typeof process !== 'undefined'
      ? (process as unknown as { env?: Record<string, string | undefined> })
      : undefined;
  const envModel = proc?.env?.OPENAI_MODEL;
  if (envModel && typeof envModel === 'string' && envModel.trim().length > 0) {
    return envModel.trim();
  }
  return DEFAULT_OPENAI_MODEL;
}

export default getOpenAIModel;
