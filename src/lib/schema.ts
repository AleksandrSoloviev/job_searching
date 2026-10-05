import { z } from 'zod'

export const CATALOG_SCHEMA_VERSION = '1.0.0'

const optionalHttpUrl = z.union([z.string().url(), z.literal('')]).optional()
const optionalEmail = z.union([z.string().email(), z.literal('')]).optional()

export const vacancySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  publishedAt: z.string().optional(),
  summary: z.string().optional(),
})

export const companySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  website: optionalHttpUrl,
  email: optionalEmail,
  coverLetter: z.string().optional().default(''),
  vacancies: z.array(vacancySchema).optional().default([]),
  vacanciesSource: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const catalogSchema = z.object({
  schemaVersion: z.string().min(1),
  companies: z.array(companySchema),
})

export type Vacancy = z.infer<typeof vacancySchema>
export type Company = z.infer<typeof companySchema>
export type Catalog = z.infer<typeof catalogSchema>

export const parseCatalog = (data: unknown): Catalog => {
  const catalog = catalogSchema.parse(data)
  const [major] = catalog.schemaVersion.split('.')

  if (major !== '1') {
    throw new Error('Несовместимая мажорная версия схемы каталога')
  }

  return catalog
}

export const createEmptyCatalog = (): Catalog => ({
  schemaVersion: CATALOG_SCHEMA_VERSION,
  companies: [],
})
