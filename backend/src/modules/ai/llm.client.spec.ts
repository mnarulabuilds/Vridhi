import { resolveLlmConfig } from './llm.client';

describe('resolveLlmConfig', () => {
  it('defaults to OpenAI', () => {
    const config = resolveLlmConfig({ OPENAI_API_KEY: 'sk-test', OPENAI_MODEL: 'gpt-4o-mini' });
    expect(config.provider).toBe('openai');
    expect(config.baseUrl).toContain('api.openai.com');
  });

  it('points Ollama at the local OpenAI-compatible server', () => {
    const config = resolveLlmConfig({ AI_PROVIDER: 'ollama' });
    expect(config.provider).toBe('ollama');
    expect(config.baseUrl).toBe('http://127.0.0.1:11434/v1');
    expect(config.model).toBe('llama3.1');
    expect(config.apiKey).toBeUndefined();
  });

  it('honours a custom base URL for Groq or other proxies', () => {
    const config = resolveLlmConfig({
      AI_PROVIDER: 'openai',
      OPENAI_BASE_URL: 'https://api.groq.com/openai/v1',
      OPENAI_MODEL: 'llama-3.1-8b-instant',
      OPENAI_API_KEY: 'gsk_test',
    });
    expect(config.baseUrl).toBe('https://api.groq.com/openai/v1');
    expect(config.model).toBe('llama-3.1-8b-instant');
  });
});
