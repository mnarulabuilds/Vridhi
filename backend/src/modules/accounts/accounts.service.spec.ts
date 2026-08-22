import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  it('should be defined', () => {
    const service = new AccountsService({} as any);
    expect(service).toBeDefined();
  });
});
