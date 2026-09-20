import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { convertCurrency, DEFAULT_USD_RATES, normalizeCurrency, type UsdPivotRates } from './fx';

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);
  private cachedRates: UsdPivotRates | null = null;
  private cachedAt = 0;

  constructor(private readonly config: ConfigService) {}

  private parseEnvRates(): UsdPivotRates | null {
    const raw = this.config.get<string>('FX_RATES_JSON');
    if (!raw?.trim()) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, number>;
      return { USD: 1, ...Object.fromEntries(
        Object.entries(parsed).map(([code, rate]) => [normalizeCurrency(code), Number(rate)]),
      ) };
    } catch {
      this.logger.warn('FX_RATES_JSON is invalid JSON; using defaults');
      return null;
    }
  }

  async getRates(): Promise<UsdPivotRates> {
    const ttlMs = Number(this.config.get('FX_RATES_TTL_MS') ?? 6 * 60 * 60 * 1000);
    const now = Date.now();
    if (this.cachedRates && now - this.cachedAt < ttlMs) {
      return this.cachedRates;
    }

    const fromEnv = this.parseEnvRates();
    if (fromEnv) {
      this.cachedRates = fromEnv;
      this.cachedAt = now;
      return fromEnv;
    }

    const live = await this.fetchFrankfurterRates();
    this.cachedRates = live;
    this.cachedAt = now;
    return live;
  }

  private async fetchFrankfurterRates(): Promise<UsdPivotRates> {
    const symbols = 'INR,EUR,GBP';
    try {
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=USD&to=${symbols}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const body = (await response.json()) as { rates?: Record<string, number> };
      const rates: UsdPivotRates = { USD: 1 };
      for (const [code, value] of Object.entries(body.rates ?? {})) {
        rates[normalizeCurrency(code)] = Number(value);
      }
      for (const code of ['INR', 'EUR', 'GBP'] as const) {
        if (!rates[code]) {
          rates[code] = DEFAULT_USD_RATES[code];
        }
      }
      return rates;
    } catch (error) {
      this.logger.warn(
        `Live FX fetch failed (${error instanceof Error ? error.message : error}); using defaults`,
      );
      return { ...DEFAULT_USD_RATES };
    }
  }

  async convert(amount: number, from: string, to: string): Promise<number> {
    const rates = await this.getRates();
    return convertCurrency(amount, from, to, rates);
  }
}
