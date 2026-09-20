import { buildCorsOptions } from './cors';

describe('buildCorsOptions', () => {
  it('allows all origins when unset', () => {
    expect(buildCorsOptions(undefined)).toEqual({ origin: true, credentials: true });
    expect(buildCorsOptions('')).toEqual({ origin: true, credentials: true });
  });

  it('allows all origins when set to *', () => {
    expect(buildCorsOptions('*')).toEqual({ origin: true, credentials: true });
  });

  it('restricts to listed origins', () => {
    expect(buildCorsOptions('https://app.example.com, https://other.test')).toEqual({
      origin: ['https://app.example.com', 'https://other.test'],
      credentials: true,
    });
  });
});
