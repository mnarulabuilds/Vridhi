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
  baseUrl: string;
  apiKey?: string;
  model: string;
}

function withV1(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

export async function createChatCompletion(
  options: LlmClientOptions,
  body: Record<string, unknown>,
): Promise<LlmMessage> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }

  const response = await fetch(`${withV1(options.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: options.model, ...body }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`LLM provider error: ${response.status} ${detail.slice(0, 400)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: LlmMessage }>;
  };
  const message = payload.choices?.[0]?.message;
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
}) {
  const provider = (env.AI_PROVIDER || 'openai').trim().toLowerCase();
  const customBase = env.OPENAI_BASE_URL?.trim();
  const baseUrl =
    customBase ||
    (provider === 'ollama' ? 'http://127.0.0.1:11434/v1' : 'https://api.openai.com/v1');
  const model =
    env.OPENAI_MODEL?.trim() || (provider === 'ollama' ? 'llama3.1' : 'gpt-4o-mini');
  return {
    provider,
    baseUrl,
    apiKey: env.OPENAI_API_KEY?.trim(),
    model,
  };
}
