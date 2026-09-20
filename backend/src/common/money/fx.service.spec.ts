import { FxService } from './fx.service';

describe('FxService', () => {
  it('uses FX_RATES_JSON when set', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'FX_RATES_JSON') return '{"INR":90,"EUR":0.9,"GBP":0.8}';
        if (key === 'FX_RATES_TTL_MS') return 600000;
        return undefined;
      }),
    };
    const service = new FxService(config as never);
    const rates = await service.getRates();
    expect(rates.INR).toBe(90);
    expect(await service.convert(90, 'INR', 'USD')).toBeCloseTo(1, 5);
  });

  it('falls back to defaults when env JSON is invalid', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'FX_RATES_JSON') return '{bad';
        return undefined;
      }),
    };
    const service = new FxService(config as never);
    const rates = await service.getRates();
    expect(rates.INR).toBeGreaterThan(0);
  });

  it('returns cached rates within TTL', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'FX_RATES_JSON') return '{"INR":100}';
        if (key === 'FX_RATES_TTL_MS') return 600000;
        return undefined;
      }),
    };
    const service = new FxService(config as never);
    const first = await service.getRates();
    const second = await service.getRates();
    expect(first).toBe(second);
  });

  it('uses Frankfurter when env unset', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { INR: 83, EUR: 0.92, GBP: 0.79 } }),
    }) as never;
    const config = { get: jest.fn(() => undefined) };
    const service = new FxService(config as never);
    const rates = await service.getRates();
    expect(rates.INR).toBe(83);
  });

  it('uses defaults when Frankfurter fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as never;
    const config = { get: jest.fn(() => undefined) };
    const service = new FxService(config as never);
    const rates = await service.getRates();
    expect(rates.USD).toBe(1);
    expect(rates.INR).toBeGreaterThan(0);
  });
});
