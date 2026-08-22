export function validateEnv(config: Record<string, unknown>) {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  for (const key of required) {
    if (!config[key] || String(config[key]).trim() === '') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  const nodeEnv = String(config.NODE_ENV ?? 'development');
  const jwtSecret = String(config.JWT_SECRET);
  if (nodeEnv === 'production' && (jwtSecret.length < 32 || /replace-with|change-me/i.test(jwtSecret))) {
    throw new Error('JWT_SECRET must be a long random value in production');
  }
  return {
    ...config,
    PORT: config.PORT ?? 3001,
    JWT_ACCESS_TOKEN_EXPIRY: config.JWT_ACCESS_TOKEN_EXPIRY ?? '15m',
    JWT_REFRESH_TOKEN_EXPIRY_DAYS: Number(config.JWT_REFRESH_TOKEN_EXPIRY_DAYS ?? 30),
    CORS_ORIGINS: config.CORS_ORIGINS ?? '',
    AI_PROVIDER: String(config.AI_PROVIDER ?? 'openai').toLowerCase(),
    OPENAI_BASE_URL: config.OPENAI_BASE_URL ?? '',
    OPENAI_MODEL: config.OPENAI_MODEL ?? (String(config.AI_PROVIDER ?? '').toLowerCase() === 'ollama' ? 'llama3.2' : 'gpt-4o-mini'),
  };
}
