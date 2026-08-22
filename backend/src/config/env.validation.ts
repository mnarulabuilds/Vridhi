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
    OPENAI_MODEL: config.OPENAI_MODEL ?? 'gpt-4o-mini',
  };
}
