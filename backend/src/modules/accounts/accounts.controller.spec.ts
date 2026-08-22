import { AccountsController } from './accounts.controller';

describe('AccountsController', () => {
  it('should be defined', () => {
    const controller = new AccountsController({} as any);
    expect(controller).toBeDefined();
  });
});
