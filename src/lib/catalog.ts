import {
  createEmptyCatalog,
  parseFileCatalog,
  parseWorkingCatalog,
  todayIsoDate,
  type Catalog,
  type Company,
  type FileCatalog,
} from '@/lib/schema'
import { readCatalog, writeCatalog } from '@/lib/storage'

export const upsertCompany = (catalog: Catalog, company: Company): Catalog => ({
  schemaVersion: catalog.schemaVersion,
  companies: [
    ...catalog.companies.filter((item) => item.id !== company.id),
    company,
  ],
})

export const removeCompany = (catalog: Catalog, companyId: string): Catalog => ({
  schemaVersion: catalog.schemaVersion,
  companies: catalog.companies.filter((item) => item.id !== companyId),
})

export const markVacancyAppliedToday = (
  catalog: Catalog,
  companyId: string,
  vacancyId: string,
): Catalog => {
  const company = catalog.companies.find((item) => item.id === companyId)

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

export const hydrateFileCatalog = (fileCatalog: FileCatalog): Catalog => ({
  schemaVersion: fileCatalog.schemaVersion,
  companies: fileCatalog.companies,
})

export const importFileCatalog = (data: unknown): Catalog => {
  return hydrateFileCatalog(parseFileCatalog(data))
}

export const toFileCatalog = (catalog: Catalog): FileCatalog => ({
  schemaVersion: catalog.schemaVersion,
  companies: catalog.companies.map((company) => ({
    id: company.id,
    name: company.name,
    website: company.website,
    email: company.email,
    coverLetter: company.coverLetter,
    vacancies: company.vacancies,
    vacanciesSource: company.vacanciesSource,
    updatedAt: company.updatedAt,
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
  return seed
}
