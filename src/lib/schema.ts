import { z } from 'zod'
import { isCiphertextEnvelope } from '@/lib/letter-crypto'

export const CATALOG_SCHEMA_VERSION = '1.0.0'

const optionalHttpUrl = z.union([z.string().url(), z.literal('')]).optional()
const optionalEmail = z.union([z.string().email(), z.literal('')]).optional()

const fileCoverLetterSchema = z.string().refine(
  (value) => value === '' || isCiphertextEnvelope(value),
  { error: 'coverLetter в файле должен быть пустым или конвертом enc.v1' },
)

export const vacancySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  publishedAt: z.string().optional(),
  summary: z.string().optional(),
})

const companyBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  website: optionalHttpUrl,
  email: optionalEmail,
  vacancies: z.array(vacancySchema).optional().default([]),
  vacanciesSource: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const fileCompanySchema = companyBaseSchema.extend({
  coverLetter: fileCoverLetterSchema.optional().default(''),
})

export const workingCompanySchema = companyBaseSchema.extend({
  coverLetter: z.string().optional().default(''),
})

export const fileCatalogSchema = z.object({
  schemaVersion: z.string().min(1),
  companies: z.array(fileCompanySchema),
})

export const workingCatalogSchema = z.object({
  schemaVersion: z.string().min(1),
  companies: z.array(workingCompanySchema),
})

export type Vacancy = z.infer<typeof vacancySchema>
export type FileCompany = z.infer<typeof fileCompanySchema>
export type Company = z.infer<typeof workingCompanySchema>
export type FileCatalog = z.infer<typeof fileCatalogSchema>
export type Catalog = z.infer<typeof workingCatalogSchema>

const assertCompatibleVersion = (schemaVersion: string): void => {
  const [major] = schemaVersion.split('.')

  if (major !== '1') {
    throw new Error('Несовместимая мажорная версия схемы каталога')
  }
}

const dedupeById = <T extends { id: string }>(items: T[]): T[] => {
  const unique = new Map<string, T>()

  for (const item of items) {
    unique.set(item.id, item)
  }

  return [...unique.values()]
}

export const parseFileCatalog = (data: unknown): FileCatalog => {
  const catalog = fileCatalogSchema.parse(data)
  assertCompatibleVersion(catalog.schemaVersion)

  return {
    schemaVersion: catalog.schemaVersion,
    companies: dedupeById(catalog.companies),
  }
}

export const parseWorkingCatalog = (data: unknown): Catalog => {
  const catalog = workingCatalogSchema.parse(data)
  assertCompatibleVersion(catalog.schemaVersion)

  return {
    schemaVersion: catalog.schemaVersion,
    companies: dedupeById(catalog.companies),
  }
}

export const parseCatalog = parseWorkingCatalog

export const createEmptyCatalog = (): Catalog => ({
  schemaVersion: CATALOG_SCHEMA_VERSION,
  companies: [],
})

export const createCompanyId = (): string => crypto.randomUUID()

export const createVacancyId = (): string => crypto.randomUUID()
