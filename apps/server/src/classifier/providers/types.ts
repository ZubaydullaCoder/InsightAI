export type ClassifierProviderName = 'gemini' | 'ollama' | 'openai-compatible' | 'rule-only'

export type ProviderRawResult = {
  rawJson: unknown
  provider: ClassifierProviderName
  model: string
  latencyMs: number
}
