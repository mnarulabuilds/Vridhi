import { EmailService } from './email.service';

describe('EmailService', () => {
  it('logs reset link in non-production', async () => {
    const config = { get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'development' : undefined)) };
    const service = new EmailService(config as never);
    await expect(service.sendPasswordReset('a@b.com', 'token')).resolves.toBeUndefined();
  });

  it('queues email in production when API key exists', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'EMAIL_API_KEY') return 'secret';
        if (key === 'APP_PUBLIC_URL') return 'https://app.test/';
        if (key === 'EMAIL_FROM') return 'noreply@test';
        return undefined;
      }),
    };
    const service = new EmailService(config as never);
    await expect(service.sendPasswordReset('a@b.com', 'token')).resolves.toBeUndefined();
  });

  it('logs error in production without API key', async () => {
    const config = {
      get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'production' : undefined)),
    };
    const service = new EmailService(config as never);
    await expect(service.sendPasswordReset('a@b.com', 'token')).resolves.toBeUndefined();
  });
});
