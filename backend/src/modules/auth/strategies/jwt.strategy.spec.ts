import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('maps jwt payload to the current user shape', async () => {
    const config = {
      getOrThrow: jest.fn().mockReturnValue('a'.repeat(32)),
    };
    const strategy = new JwtStrategy(config as any);
    await expect(strategy.validate({ sub: 'user-1', email: 'a@example.com' })).resolves.toEqual({
      id: 'user-1',
      email: 'a@example.com',
    });
  });
});
