import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockEnv = vi.hoisted(() => ({
  env: {
    AI_PROVIDER:   'gemini' as 'gemini' | 'ollama' | 'openai-compatible' | 'rule-only',
    AI_MODEL:      'gemini-2.5-flash',
    AI_API_KEY:    'test-key',
    AI_TIMEOUT_MS: 30000,
  },
}))

vi.mock('../shared/env.js', () => mockEnv)

const loggerMocks = vi.hoisted(() => ({
  error: vi.fn(),
  info:  vi.fn(),
}))

vi.mock('../shared/logger.js', () => ({
  logger: loggerMocks,
}))

const geminiProviderMocks = vi.hoisted(() => ({
  classifyWithGemini: vi.fn(),
}))

vi.mock('./providers/gemini.js', () => geminiProviderMocks)

const ollamaProviderMocks = vi.hoisted(() => ({
  classifyWithOllama: vi.fn(),
}))

vi.mock('./providers/ollama.js', () => ollamaProviderMocks)

const openAiCompatibleProviderMocks = vi.hoisted(() => ({
  classifyWithOpenAiCompatible: vi.fn(),
}))

vi.mock('./providers/openai-compatible.js', () => openAiCompatibleProviderMocks)

const ruleOnlyProviderMocks = vi.hoisted(() => ({
  classifyWithRuleOnly: vi.fn(),
}))

vi.mock('./providers/rule-only.js', () => ruleOnlyProviderMocks)

import { classifyMessage } from './ai-client.js'

describe('classifyMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnv.env.AI_PROVIDER = 'gemini'
    mockEnv.env.AI_MODEL = 'gemini-2.5-flash'
  })

  it('calls the selected Gemini provider and validates its raw output', async () => {
    geminiProviderMocks.classifyWithGemini.mockResolvedValue({
      provider:  'gemini',
      model:     'gemini-2.5-flash',
      latencyMs: 42,
      rawJson:   {
        decision:      'signal',
        categories:    ['water'],
        hokim_related: false,
        short_label:   'No water',
      },
    })

    const result = await classifyMessage('Suv yoq')

    expect(result).toEqual({
      decision:      'signal',
      categories:    ['water'],
      hokim_related: false,
      short_label:   'No water',
    })
    expect(geminiProviderMocks.classifyWithGemini).toHaveBeenCalledWith('Suv yoq')
    expect(loggerMocks.info).toHaveBeenCalledWith(
      {
        event:     'classifier_provider_success',
        provider:  'gemini',
        model:     'gemini-2.5-flash',
        latencyMs: 42,
      },
      'Classifier provider returned valid output',
    )
  })

  it('calls the selected Ollama provider and validates its raw output', async () => {
    mockEnv.env.AI_PROVIDER = 'ollama'
    mockEnv.env.AI_MODEL = 'gemma3:4b'
    ollamaProviderMocks.classifyWithOllama.mockResolvedValue({
      provider:  'ollama',
      model:     'gemma3:4b',
      latencyMs: 35,
      rawJson:   {
        decision: 'ignore',
      },
    })

    const result = await classifyMessage('Salom')

    expect(result).toEqual({ decision: 'ignore' })
    expect(ollamaProviderMocks.classifyWithOllama).toHaveBeenCalledWith('Salom')
    expect(geminiProviderMocks.classifyWithGemini).not.toHaveBeenCalled()
    expect(loggerMocks.info).toHaveBeenCalledWith(
      {
        event:     'classifier_provider_success',
        provider:  'ollama',
        model:     'gemma3:4b',
        latencyMs: 35,
      },
      'Classifier provider returned valid output',
    )
  })

  it('calls the selected OpenAI-compatible provider and validates its raw output', async () => {
    mockEnv.env.AI_PROVIDER = 'openai-compatible'
    mockEnv.env.AI_MODEL = 'qwen2.5:7b'
    openAiCompatibleProviderMocks.classifyWithOpenAiCompatible.mockResolvedValue({
      provider:  'openai-compatible',
      model:     'qwen2.5:7b',
      latencyMs: 52,
      rawJson:   {
        decision:      'signal',
        categories:    ['electricity'],
        hokim_related: false,
      },
    })

    const result = await classifyMessage('Elektr yoq')

    expect(result).toEqual({
      decision:      'signal',
      categories:    ['electricity'],
      hokim_related: false,
    })
    expect(openAiCompatibleProviderMocks.classifyWithOpenAiCompatible).toHaveBeenCalledWith('Elektr yoq')
    expect(geminiProviderMocks.classifyWithGemini).not.toHaveBeenCalled()
    expect(ollamaProviderMocks.classifyWithOllama).not.toHaveBeenCalled()
    expect(loggerMocks.info).toHaveBeenCalledWith(
      {
        event:     'classifier_provider_success',
        provider:  'openai-compatible',
        model:     'qwen2.5:7b',
        latencyMs: 52,
      },
      'Classifier provider returned valid output',
    )
  })

  it('calls the selected rule-only provider and validates its raw output', async () => {
    mockEnv.env.AI_PROVIDER = 'rule-only'
    mockEnv.env.AI_MODEL = 'rule-only'
    ruleOnlyProviderMocks.classifyWithRuleOnly.mockResolvedValue({
      provider:  'rule-only',
      model:     'rule-only',
      latencyMs: 2,
      rawJson:   {
        decision: 'ignore',
      },
    })

    const result = await classifyMessage('Salom')

    expect(result).toEqual({ decision: 'ignore' })
    expect(ruleOnlyProviderMocks.classifyWithRuleOnly).toHaveBeenCalledWith('Salom')
    expect(geminiProviderMocks.classifyWithGemini).not.toHaveBeenCalled()
    expect(ollamaProviderMocks.classifyWithOllama).not.toHaveBeenCalled()
    expect(openAiCompatibleProviderMocks.classifyWithOpenAiCompatible).not.toHaveBeenCalled()
    expect(loggerMocks.info).toHaveBeenCalledWith(
      {
        event:     'classifier_provider_success',
        provider:  'rule-only',
        model:     'rule-only',
        latencyMs: 2,
      },
      'Classifier provider returned valid output',
    )
  })

  it('throws and logs schema validation failures without logging raw message text', async () => {
    geminiProviderMocks.classifyWithGemini.mockResolvedValue({
      provider:  'gemini',
      model:     'gemini-2.5-flash',
      latencyMs: 42,
      rawJson:   {
        decision: 'signal',
      },
    })

    await expect(classifyMessage('secret message text')).rejects.toThrow(/AI output schema invalid/)

    expect(loggerMocks.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event:     'classifier_schema_invalid',
        provider:  'gemini',
        model:     'gemini-2.5-flash',
        latencyMs: 42,
      }),
      'Classifier provider output failed schema validation',
    )
    expect(JSON.stringify(loggerMocks.error.mock.calls)).not.toContain('secret message text')
  })

  it('throws selected provider failures without falling back to rule-only', async () => {
    mockEnv.env.AI_PROVIDER = 'ollama'
    mockEnv.env.AI_MODEL = 'gemma3:4b'
    ollamaProviderMocks.classifyWithOllama.mockRejectedValue(
      new Error('Ollama classification timed out after 30000ms'),
    )

    await expect(classifyMessage('secret message text')).rejects.toThrow(
      /Ollama classification timed out after 30000ms/,
    )

    expect(ruleOnlyProviderMocks.classifyWithRuleOnly).not.toHaveBeenCalled()
    expect(geminiProviderMocks.classifyWithGemini).not.toHaveBeenCalled()
    expect(openAiCompatibleProviderMocks.classifyWithOpenAiCompatible).not.toHaveBeenCalled()
  })
})
