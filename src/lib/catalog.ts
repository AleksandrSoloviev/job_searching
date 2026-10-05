import {
  createEmptyCatalog,
  createPageId,
  getActiveCompanies,
  getActivePage,
  parseFileCatalog,
  parseWorkingCatalog,
  setActivePageIndex,
  todayIsoDate,
  type Catalog,
  type CatalogPage,
  type Company,
  type FileCatalog,
} from '@/lib/schema'
import { readCatalog, writeCatalog } from '@/lib/storage'

const toFileCompany = (company: Company): Company => ({
  id: company.id,
  name: company.name,
  website: company.website,
  email: company.email,
  coverLetter: company.coverLetter,
  fameRank: company.fameRank,
  vacancies: company.vacancies,
  vacanciesSource: company.vacanciesSource,
  updatedAt: company.updatedAt,
})

const replaceActivePage = (
  catalog: Catalog,
  companies: Company[],
): Catalog => {
  const active = getActivePage(catalog)
  const nextPage: CatalogPage = { id: active.id, companies }

  return {
    schemaVersion: catalog.schemaVersion,
    activePageIndex: catalog.activePageIndex,
    pages: catalog.pages.map((page, index) =>
      index === catalog.activePageIndex ? nextPage : page,
    ),
  }
}

export const upsertCompany = (catalog: Catalog, company: Company): Catalog => {
  const companies = getActiveCompanies(catalog)

  return replaceActivePage(catalog, [
    ...companies.filter((item) => item.id !== company.id),
    company,
  ])
}

export const removeCompany = (catalog: Catalog, companyId: string): Catalog => {
  return replaceActivePage(
    catalog,
    getActiveCompanies(catalog).filter((item) => item.id !== companyId),
  )
}

export const markVacancyAppliedToday = (
  catalog: Catalog,
  companyId: string,
  vacancyId: string,
): Catalog => {
  const company = getActiveCompanies(catalog).find((item) => item.id === companyId)

  if (!company) {
    return catalog
  }

  const appliedAt = todayIsoDate()

  return upsertCompany(catalog, {
    ...company,
    updatedAt: new Date().toISOString(),
    vacancies: company.vacancies.map((vacancy) =>
      vacancy.id === vacancyId
        ? { ...vacancy, lastAppliedAt: appliedAt }
        : vacancy,
    ),
  })
}

export const hydrateFileCatalog = (fileCatalog: FileCatalog): Catalog => fileCatalog

export const importFileCatalog = (data: unknown): Catalog => {
  return hydrateFileCatalog(parseFileCatalog(data))
}

export const appendImportToCatalog = (
  catalog: Catalog,
  data: unknown,
): Catalog => {
  const incoming = parseFileCatalog(data)
  const appended = incoming.pages.map((page) => ({
    id: createPageId(),
    companies: page.companies,
  }))

  return {
    schemaVersion: catalog.schemaVersion,
    pages: [...catalog.pages, ...appended],
    activePageIndex: catalog.pages.length,
  }
}

export const toFileCatalog = (catalog: Catalog): FileCatalog => ({
  schemaVersion: catalog.schemaVersion,
  activePageIndex: catalog.activePageIndex,
  pages: catalog.pages.map((page) => ({
    id: page.id,
    companies: page.companies.map(toFileCompany),
  })),
})

export const fetchPublicSeed = async (): Promise<Catalog> => {
  const response = await fetch(`${import.meta.env.BASE_URL}data/companies.json`)

  if (!response.ok) {
    return createEmptyCatalog()
  }

  const data: unknown = await response.json()
  return importFileCatalog(data)
}

export const loadWorkingCatalog = async (): Promise<Catalog> => {
  const stored = await readCatalog()

  if (stored) {
    return stored
  }

  const seed = await fetchPublicSeed()
  await writeCatalog(seed)
  return seed
}

export const persistCatalog = async (catalog: Catalog): Promise<Catalog> => {
  const parsed = parseWorkingCatalog(catalog)
  await writeCatalog(parsed)
  return parsed
}

export const resetToPublicSeed = async (): Promise<Catalog> => {
  const seed = await fetchPublicSeed()
  await writeCatalog(seed)
  return setActivePageIndex(seed, 0)
}
