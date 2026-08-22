export interface LlmToolCall {
  id: string;
  function: { name: string; arguments: string };
}

export interface LlmMessage {
  role?: string;
  content?: string | null;
  tool_calls?: LlmToolCall[];
}

export interface LlmClientOptions {
  provider: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
}

export interface OllamaTag {
  name: string;
  size?: number;
  capabilities?: string[];
}

/** Models above this tend to pin RAM/GPU and stall interactive Ask. */
export const OLLAMA_FAST_MAX_BYTES = 8 * 1024 * 1024 * 1024;

export class NoFastOllamaModelError extends Error {
  constructor(public readonly installed: string[]) {
    super(
      installed.length
        ? `Installed Ollama model(s) are too large for interactive chat (${installed.join(', ')}). Pull a small one: ollama pull llama3.2`
        : 'Ollama is running but has no models. Pull a small one: ollama pull llama3.2',
    );
    this.name = 'NoFastOllamaModelError';
  }
}

function withV1(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

export function ollamaOrigin(baseUrl: string) {
  return baseUrl.replace(/\/$/, '').replace(/\/v1$/, '');
}

export function isHeavyOllamaModel(tag: Pick<OllamaTag, 'name' | 'size'>) {
  if (tag.size && tag.size > OLLAMA_FAST_MAX_BYTES) return true;
  return /\b(20b|22b|24b|26b|27b|32b|34b|70b|72b|405b)\b/i.test(tag.name);
}

function matchesRequested(tagName: string, requested: string) {
  const name = tagName.toLowerCase();
  const wanted = requested.toLowerCase();
  return name === wanted || name === `${wanted}:latest` || name.startsWith(`${wanted}:`);
}

export function pickOllamaModel(requested: string | undefined, tags: OllamaTag[]): string {
  if (!tags.length) {
    throw new NoFastOllamaModelError([]);
  }

  const light = tags
    .filter((tag) => !isHeavyOllamaModel(tag))
    .sort((a, b) => (a.size ?? Number.MAX_SAFE_INTEGER) - (b.size ?? Number.MAX_SAFE_INTEGER));

  const wanted = requested?.trim();
  if (wanted) {
    const match = light.find((tag) => matchesRequested(tag.name, wanted));
    if (match) return match.name;
  }

  if (light[0]) return light[0].name;

  throw new NoFastOllamaModelError(tags.map((tag) => tag.name));
}

export async function listOllamaModels(baseUrl: string): Promise<OllamaTag[]> {
  const origin = ollamaOrigin(baseUrl);
  const response = await fetch(`${origin}/api/tags`, { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) {
    throw new Error(`Ollama is not reachable at ${origin}. Start it with: ollama serve`);
  }
  const payload = (await response.json()) as { models?: OllamaTag[] };
  return payload.models ?? [];
}

async function unloadOllamaModel(baseUrl: string, name: string) {
  const origin = ollamaOrigin(baseUrl);
  await fetch(`${origin}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: name, keep_alive: 0 }),
    signal: AbortSignal.timeout(8_000),
  }).catch(() => undefined);
}

export async function prepareLlmClient(options: LlmClientOptions): Promise<LlmClientOptions> {
  if (options.provider !== 'ollama') return options;
  try {
    const tags = await listOllamaModels(options.baseUrl);
    const model = pickOllamaModel(options.model, tags);
    for (const tag of tags) {
      if (isHeavyOllamaModel(tag)) {
        void unloadOllamaModel(options.baseUrl, tag.name);
      }
    }
    return { ...options, model };
  } catch (error) {
    if (error instanceof NoFastOllamaModelError) throw error;
    if (error instanceof Error && error.message.startsWith('Ollama')) throw error;
    throw new Error(
      `Ollama is not reachable at ${ollamaOrigin(options.baseUrl)}. Start it with: ollama serve`,
    );
  }
}

async function createOllamaChat(
  options: LlmClientOptions,
  body: Record<string, unknown>,
): Promise<LlmMessage> {
  const origin = ollamaOrigin(options.baseUrl);
  const response = await fetch(`${origin}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      messages: body.messages,
      stream: false,
      think: false,
      keep_alive: '10m',
      options: {
        temperature: body.temperature ?? 0.2,
        num_ctx: 2048,
        num_predict: 256,
      },
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`LLM provider error: ${response.status} ${detail.slice(0, 400)}`);
  }

  const payload = (await response.json()) as { message?: LlmMessage };
  const message = payload.message;
  if (!message) {
    throw new Error('LLM provider returned no message');
  }
  return message;
}

export async function createChatCompletion(
  options: LlmClientOptions,
  body: Record<string, unknown>,
): Promise<LlmMessage> {
  if (options.provider === 'ollama') {
    return createOllamaChat(options, body);
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }

  const response = await fetch(`${withV1(options.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: options.model, max_tokens: 400, ...body }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`LLM provider error: ${response.status} ${detail.slice(0, 400)}`);
  }

  const result = (await response.json()) as {
    choices?: Array<{ message?: LlmMessage }>;
  };
  const message = result.choices?.[0]?.message;
  if (!message) {
    throw new Error('LLM provider returned no message');
  }
  return message;
}

export function resolveLlmConfig(env: {
  AI_PROVIDER?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}): LlmClientOptions {
  const provider = (env.AI_PROVIDER || 'openai').trim().toLowerCase();
  const customBase = env.OPENAI_BASE_URL?.trim();
  const baseUrl =
    customBase ||
    (provider === 'ollama' ? 'http://127.0.0.1:11434/v1' : 'https://api.openai.com/v1');
  const model =
    env.OPENAI_MODEL?.trim() || (provider === 'ollama' ? 'llama3.2' : 'gpt-4o-mini');
  return {
    provider,
    baseUrl,
    apiKey: env.OPENAI_API_KEY?.trim(),
    model,
  };
}
