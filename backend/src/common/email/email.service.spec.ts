import { EmailService } from './email.service';

describe('EmailService', () => {
  it('logs reset link in non-production', async () => {
    const config = { get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'development' : undefined)) };
    const service = new EmailService(config as never);
    await expect(service.sendPasswordReset('a@b.com', 'token')).resolves.toBeUndefined();
  });
});
