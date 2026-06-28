import { describe, expect, it } from 'vitest'
import { ClassifierOutputSchema } from './schema.js'

describe('ClassifierOutputSchema', () => {
  it('accepts a valid signal classification', () => {
    const result = ClassifierOutputSchema.safeParse({
      decision:      'signal',
      categories:    ['water'],
      hokim_related: false,
      classify_reason:   'No water for three days',
    })

    expect(result.success).toBe(true)
  })

  it('accepts a multi-category signal classification', () => {
    const result = ClassifierOutputSchema.safeParse({
      decision:   'signal',
      categories: ['electricity', 'gas'],
    })

    expect(result.success).toBe(true)
  })

  it('accepts a valid ignore classification', () => {
    const result = ClassifierOutputSchema.safeParse({
      decision: 'ignore',
    })

    expect(result.success).toBe(true)
  })

  it('rejects a signal classification without categories', () => {
    const result = ClassifierOutputSchema.safeParse({
      decision: 'signal',
    })

    expect(result.success).toBe(false)
  })

  it('rejects a signal classification with an empty categories array', () => {
    const result = ClassifierOutputSchema.safeParse({
      decision:   'signal',
      categories: [],
    })

    expect(result.success).toBe(false)
  })

  it('rejects an invalid decision', () => {
    const result = ClassifierOutputSchema.safeParse({
      decision: 'maybe',
    })

    expect(result.success).toBe(false)
  })
})
