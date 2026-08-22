import { NoFastOllamaModelError, pickOllamaModel, resolveLlmConfig } from './llm.client';

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
    expect(config.model).toBe('llama3.2');
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

describe('pickOllamaModel', () => {
  const gemma = {
    name: 'gemma4:26b',
    size: 17_987_581_215,
    capabilities: ['completion', 'tools', 'thinking'],
  };
  const llama = {
    name: 'llama3.2:latest',
    size: 2_000_000_000,
    capabilities: ['completion', 'tools'],
  };

  it('uses the requested model when a small match is installed', () => {
    expect(pickOllamaModel('llama3.2', [gemma, llama])).toBe('llama3.2:latest');
  });

  it('skips a huge requested model in favour of a small one', () => {
    expect(pickOllamaModel('gemma4:26b', [gemma, llama])).toBe('llama3.2:latest');
  });

  it('throws when only a huge model is installed', () => {
    expect(() => pickOllamaModel('gemma4:26b', [gemma])).toThrow(NoFastOllamaModelError);
  });

  it('throws when Ollama has no models', () => {
    expect(() => pickOllamaModel('llama3.2', [])).toThrow(/no models/i);
  });
});
