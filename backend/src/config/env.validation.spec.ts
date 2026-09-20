import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const base = {
    DATABASE_URL: 'postgresql://localhost/vridhi',
    JWT_SECRET: 'x'.repeat(32),
  };

  it('requires DATABASE_URL and JWT_SECRET', () => {
    expect(() => validateEnv({ JWT_SECRET: 'secret' })).toThrow('DATABASE_URL');
    expect(() => validateEnv({ DATABASE_URL: 'postgresql://x' })).toThrow('JWT_SECRET');
  });

  it('rejects weak JWT_SECRET in production', () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        JWT_SECRET: 'change-me',
      }),
    ).toThrow('JWT_SECRET');
  });

  it('applies defaults', () => {
    const env = validateEnv({ ...base, NODE_ENV: 'development' });
    expect(env.PORT).toBe(3001);
    expect(env.JWT_ACCESS_TOKEN_EXPIRY).toBe('15m');
    expect(env.JWT_REFRESH_TOKEN_EXPIRY_DAYS).toBe(30);
    expect(env.AI_PROVIDER).toBe('openai');
  });
});
