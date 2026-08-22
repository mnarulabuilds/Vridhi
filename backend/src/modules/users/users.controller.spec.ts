import { UsersController } from './users.controller';

describe('UsersController', () => {
  it('should be defined', () => {
    const controller = new UsersController({} as any);
    expect(controller).toBeDefined();
  });
});
