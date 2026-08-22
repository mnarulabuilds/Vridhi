export function validateEnv(config: Record<string, unknown>) {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  for (const key of required) {
    if (!config[key] || String(config[key]).trim() === '') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  return {
    ...config,
    PORT: config.PORT ?? 3001,
    JWT_ACCESS_TOKEN_EXPIRY: config.JWT_ACCESS_TOKEN_EXPIRY ?? '15m',
    JWT_REFRESH_TOKEN_EXPIRY_DAYS: Number(config.JWT_REFRESH_TOKEN_EXPIRY_DAYS ?? 30),
    CORS_ORIGINS: config.CORS_ORIGINS ?? '',
    AI_PROVIDER: String(config.AI_PROVIDER ?? 'openai').toLowerCase(),
    OPENAI_BASE_URL: config.OPENAI_BASE_URL ?? '',
    OPENAI_MODEL: config.OPENAI_MODEL ?? (String(config.AI_PROVIDER ?? '').toLowerCase() === 'ollama' ? 'llama3.1' : 'gpt-4o-mini'),
  };
}
