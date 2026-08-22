import { toPublicProfile } from './users.service';

describe('toPublicProfile', () => {
  it('omits passwordHash', () => {
    expect(
      toPublicProfile({
        id: '1',
        name: 'Maya',
        email: 'maya@example.com',
        preferredCurrency: 'INR',
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
      }),
    ).toEqual({
      id: '1',
      name: 'Maya',
      email: 'maya@example.com',
      preferredCurrency: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
    });
  });
});
