import { UsersService } from './users.service';

describe('UsersService', () => {
  it('should be defined', () => {
    const service = new UsersService({} as any);
    expect(service).toBeDefined();
  });
});
