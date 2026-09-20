import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/** When CORS_ORIGINS is empty, allow any origin (mobile apps + Expo web). Set explicit origins in production to lock down browsers. */
export function buildCorsOptions(corsOriginsEnv?: string): CorsOptions {
  const origins = (corsOriginsEnv ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0 || origins.includes('*')) {
    return {
      origin: true,
      credentials: true,
    };
  }

  return {
    origin: origins,
    credentials: true,
  };
}
