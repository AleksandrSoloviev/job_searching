import { z } from 'zod'

export const CATALOG_SCHEMA_VERSION = '1.0.0'
export const SEED_PAGE_ID = 'seed'

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
  fameRank: z.number().finite().optional(),
  vacancies: z.array(vacancySchema).optional().default([]),
  vacanciesSource: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const catalogPageSchema = z.object({
  id: z.string().min(1),
  companies: z.array(companySchema),
})

export const catalogSchema = z.object({
  schemaVersion: z.string().min(1),
  companies: z.array(companySchema).optional(),
  pages: z.array(catalogPageSchema).optional(),
  activePageIndex: z.number().optional(),
})

export const fileCompanySchema = companySchema
export const workingCompanySchema = companySchema
export const fileCatalogSchema = catalogSchema
export const workingCatalogSchema = catalogSchema

export type Vacancy = z.infer<typeof vacancySchema>
export type FileCompany = z.infer<typeof fileCompanySchema>
export type Company = z.infer<typeof workingCompanySchema>
export type CatalogPage = {
  id: string
  companies: Company[]
}
export type Catalog = {
  schemaVersion: string
  pages: CatalogPage[]
  activePageIndex: number
}
export type FileCatalog = Catalog

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

const clampPageIndex = (index: number, pageCount: number): number => {
  if (pageCount <= 0) {
    return 0
  }

  if (!Number.isFinite(index)) {
    return 0
  }

  return Math.min(Math.max(0, Math.trunc(index)), pageCount - 1)
}

export const createPageId = (): string => crypto.randomUUID()

export const normalizeCatalogPages = (
  schemaVersion: string,
  pagesInput: CatalogPage[] | undefined,
  companiesInput: Company[] | undefined,
  activePageIndex: number | undefined,
): Catalog => {
  const fromPages =
    pagesInput && pagesInput.length > 0
      ? pagesInput.map((page) => ({
          id: page.id,
          companies: dedupeById(page.companies),
        }))
      : [
          {
            id: SEED_PAGE_ID,
            companies: dedupeById(companiesInput ?? []),
          },
        ]

  return {
    schemaVersion,
    pages: fromPages,
    activePageIndex: clampPageIndex(activePageIndex ?? 0, fromPages.length),
  }
}

export const parseCatalog = (data: unknown): Catalog => {
  const catalog = catalogSchema.parse(data)
  assertCompatibleVersion(catalog.schemaVersion)

  return normalizeCatalogPages(
    catalog.schemaVersion,
    catalog.pages,
    catalog.companies,
    catalog.activePageIndex,
  )
}

export const parseFileCatalog = parseCatalog
export const parseWorkingCatalog = parseCatalog

export const createEmptyCatalog = (): Catalog => ({
  schemaVersion: CATALOG_SCHEMA_VERSION,
  pages: [{ id: createPageId(), companies: [] }],
  activePageIndex: 0,
})

export const getActivePage = (catalog: Catalog): CatalogPage => {
  return (
    catalog.pages[catalog.activePageIndex] ??
    catalog.pages[0] ?? { id: SEED_PAGE_ID, companies: [] }
  )
}

export const getActiveCompanies = (catalog: Catalog): Company[] => {
  return getActivePage(catalog).companies
}

export const setActivePageIndex = (
  catalog: Catalog,
  pageIndex: number,
): Catalog => ({
  schemaVersion: catalog.schemaVersion,
  pages: catalog.pages,
  activePageIndex: clampPageIndex(pageIndex, catalog.pages.length),
})

export const createCompanyId = (): string => crypto.randomUUID()

export const createVacancyId = (): string => crypto.randomUUID()
