import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('should be defined', () => {
    const controller = new AuthController({} as any);
    expect(controller).toBeDefined();
  });
});
