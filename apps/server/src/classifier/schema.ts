import { z } from 'zod/v3'

export const CategorySchema = z.enum(['water', 'electricity', 'gas', 'waste'])

export const ClassifierOutputSchema = z.discriminatedUnion('decision', [
  z.object({
    decision:      z.literal('signal'),
    // categories is an array so a single message can produce one signal per
    // service category (e.g. ["electricity", "gas"] for "svet ham gaz ham yo'q").
    // min(1) ensures at least one category; max(4) matches the four allowed values.
    categories:    z.array(CategorySchema).min(1).max(4),
    hokim_related: z.boolean().optional(),
    short_label:   z.string().max(100).optional(),
  }),
  z.object({
    decision:      z.literal('ignore'),
    categories:    z.array(CategorySchema).optional(),
    hokim_related: z.boolean().optional(),
    short_label:   z.string().max(100).optional(),
  }),
])

export type ClassifierOutput = z.infer<typeof ClassifierOutputSchema>
