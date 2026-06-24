import { env } from '../shared/env.js'
import { logger } from '../shared/logger.js'
import { classifyWithGemini } from './providers/gemini.js'
import { classifyWithOllama } from './providers/ollama.js'
import { classifyWithOpenAiCompatible } from './providers/openai-compatible.js'
import { classifyWithRuleOnly } from './providers/rule-only.js'
import type { ProviderRawResult } from './providers/types.js'
import { ClassifierOutputSchema, type ClassifierOutput } from './schema.js'

export async function classifyMessage(text: string): Promise<ClassifierOutput> {
  const rawResult = await classifyWithConfiguredProvider(text)
  const result = ClassifierOutputSchema.safeParse(rawResult.rawJson)

  if (!result.success) {
    logger.error(
      {
        event:     'classifier_schema_invalid',
        provider:  rawResult.provider,
        model:     rawResult.model,
        latencyMs: rawResult.latencyMs,
        err:       result.error,
      },
      'Classifier provider output failed schema validation',
    )
    throw new Error(`AI output schema invalid: ${result.error.message}`)
  }

  logger.info(
    {
      event:     'classifier_provider_success',
      provider:  rawResult.provider,
      model:     rawResult.model,
      latencyMs: rawResult.latencyMs,
    },
    'Classifier provider returned valid output',
  )

  return result.data
}

async function classifyWithConfiguredProvider(text: string): Promise<ProviderRawResult> {
  switch (env.AI_PROVIDER) {
    case 'gemini':
      return classifyWithGemini(text)
    case 'ollama':
      return classifyWithOllama(text)
    case 'openai-compatible':
      return classifyWithOpenAiCompatible(text)
    case 'rule-only':
      return classifyWithRuleOnly(text)
  }
}
