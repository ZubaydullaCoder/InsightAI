import { zodToJsonSchema } from 'zod-to-json-schema'
import { env } from '../../shared/env.js'
import { logger } from '../../shared/logger.js'
import { buildPlainPrompt } from '../prompt.js'
import { ClassifierOutputSchema } from '../schema.js'
import type { ProviderRawResult } from './types.js'

type ResponseFormatMode = 'json_schema' | 'json_object' | 'prompt_only'

type OpenAiCompatibleChatResponse = {
  choices?: Array<{
    message?: {
      content?: unknown
    }
  }>
}

type AttemptResult = {
  response: Response
  mode: ResponseFormatMode
}

export async function classifyWithOpenAiCompatible(text: string): Promise<ProviderRawResult> {
  if (!env.AI_BASE_URL) {
    throw new Error('AI_BASE_URL is required for OpenAI-compatible provider')
  }
  if (!env.AI_API_KEY) {
    throw new Error('AI_API_KEY is required for OpenAI-compatible provider')
  }

  const startedAt = Date.now()
  const endpoint = buildChatCompletionsEndpoint(env.AI_BASE_URL)
  const prompt = buildPlainPrompt(text)
  const { response, mode } = await requestWithResponseFormatFallback(endpoint, prompt)
  const latencyMs = Date.now() - startedAt

  if (!response.ok) {
    logger.warn(
      {
        event:     'classifier_provider_http_error',
        provider:  'openai-compatible',
        model:     env.AI_MODEL,
        latencyMs,
        status:    response.status,
      },
      'OpenAI-compatible classification HTTP request failed',
    )
    throw new Error(`OpenAI-compatible classification failed with HTTP ${response.status}`)
  }

  const body = await parseResponseJson(response)
  const content = body.choices?.[0]?.message?.content

  if (typeof content !== 'string' || content.trim() === '') {
    throw new Error('OpenAI-compatible classification returned empty message content')
  }

  return {
    provider: 'openai-compatible',
    model:    env.AI_MODEL,
    latencyMs,
    rawJson:  parseModelJson(content, mode),
  }
}

async function requestWithResponseFormatFallback(
  endpoint: string,
  prompt: string,
): Promise<AttemptResult> {
  const jsonSchemaResponse = await sendChatCompletion(endpoint, prompt, 'json_schema')
  if (!await shouldRetryWithoutJsonSchema(jsonSchemaResponse)) {
    return { response: jsonSchemaResponse, mode: 'json_schema' }
  }

  logger.info(
    {
      event:    'classifier_provider_response_format_fallback',
      provider: 'openai-compatible',
      model:    env.AI_MODEL,
      from:     'json_schema',
      to:       'json_object',
    },
    'OpenAI-compatible provider rejected JSON Schema response format; retrying JSON object mode',
  )

  const jsonObjectResponse = await sendChatCompletion(endpoint, prompt, 'json_object')
  if (!await shouldRetryWithoutJsonSchema(jsonObjectResponse)) {
    return { response: jsonObjectResponse, mode: 'json_object' }
  }

  logger.info(
    {
      event:    'classifier_provider_response_format_fallback',
      provider: 'openai-compatible',
      model:    env.AI_MODEL,
      from:     'json_object',
      to:       'prompt_only',
    },
    'OpenAI-compatible provider rejected response_format; retrying prompt-only JSON extraction',
  )

  return {
    response: await sendChatCompletion(endpoint, prompt, 'prompt_only'),
    mode:     'prompt_only',
  }
}

async function sendChatCompletion(
  endpoint: string,
  prompt: string,
  mode: ResponseFormatMode,
): Promise<Response> {
  const controller = new AbortController()

  return fetchWithTimeout(
    fetch(endpoint, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${env.AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model:    env.AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        ...buildResponseFormat(mode),
      }),
      signal: controller.signal,
    }),
    controller,
  )
}

function buildResponseFormat(mode: ResponseFormatMode): object {
  if (mode === 'json_schema') {
    return {
      response_format: {
        type:        'json_schema',
        json_schema: {
          name:   'classifier_output',
          schema: zodToJsonSchema(ClassifierOutputSchema),
          strict: true,
        },
      },
    }
  }

  if (mode === 'json_object') {
    return {
      response_format: {
        type: 'json_object',
      },
    }
  }

  return {}
}

async function shouldRetryWithoutJsonSchema(response: Response): Promise<boolean> {
  if (response.status !== 400) {
    return false
  }

  try {
    const body = await response.clone().text()
    return /response_format|json_schema|json_object|unsupported/i.test(body)
  } catch {
    return false
  }
}

function buildChatCompletionsEndpoint(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`

  return new URL('chat/completions', normalizedBaseUrl).toString()
}

async function fetchWithTimeout(
  request: Promise<Response>,
  controller: AbortController,
): Promise<Response> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      logger.warn(
        {
          event:     'classifier_provider_timeout',
          provider:  'openai-compatible',
          model:     env.AI_MODEL,
          timeoutMs: env.AI_TIMEOUT_MS,
        },
        'OpenAI-compatible classification timed out',
      )
      reject(new Error(`OpenAI-compatible classification timed out after ${env.AI_TIMEOUT_MS}ms`))
    }, env.AI_TIMEOUT_MS)
  })

  try {
    return await Promise.race([request, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

async function parseResponseJson(response: Response): Promise<OpenAiCompatibleChatResponse> {
  try {
    return await response.json() as OpenAiCompatibleChatResponse
  } catch (err) {
    throw new Error(`OpenAI-compatible classification returned invalid response JSON: ${getErrorMessage(err)}`)
  }
}

function parseModelJson(content: string, mode: ResponseFormatMode): unknown {
  try {
    return JSON.parse(content)
  } catch (err) {
    throw new Error(`OpenAI-compatible classification returned invalid ${mode} content JSON: ${getErrorMessage(err)}`)
  }
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown parse error'
}
