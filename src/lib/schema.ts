import { z } from 'zod'

export const CATALOG_SCHEMA_VERSION = '1.0.0'

const optionalHttpUrl = z.union([z.string().url(), z.literal('')]).optional()
const optionalEmail = z.union([z.string().email(), z.literal('')]).optional()

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export const isIsoDate = (value: string): boolean => {
  const match = ISO_DATE_PATTERN.exec(value)

  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const utc = new Date(Date.UTC(year, month - 1, day))

  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  )
}

export const todayIsoDate = (): string => {
  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const optionalIsoDate = z
  .string()
  .optional()
  .default('')
  .refine((value) => value === '' || isIsoDate(value), {
    error: 'lastAppliedAt должен быть датой YYYY-MM-DD или пустым',
  })

export const vacancySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  publishedAt: z.string().optional(),
  summary: z.string().optional(),
  lastAppliedAt: optionalIsoDate,
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

export const fileCompanySchema = companySchema
export const workingCompanySchema = companySchema

export const catalogSchema = z.object({
  schemaVersion: z.string().min(1),
  companies: z.array(companySchema),
})

export const fileCatalogSchema = catalogSchema
export const workingCatalogSchema = catalogSchema

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

export const parseCatalog = (data: unknown): Catalog => {
  const catalog = catalogSchema.parse(data)
  assertCompatibleVersion(catalog.schemaVersion)

  return {
    schemaVersion: catalog.schemaVersion,
    companies: dedupeById(catalog.companies),
  }
}

export const parseFileCatalog = parseCatalog
export const parseWorkingCatalog = parseCatalog

export const createEmptyCatalog = (): Catalog => ({
  schemaVersion: CATALOG_SCHEMA_VERSION,
  companies: [],
})

export const createCompanyId = (): string => crypto.randomUUID()

export const createVacancyId = (): string => crypto.randomUUID()
