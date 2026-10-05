import {
  decryptLetter,
  encryptLetter,
  isCiphertextEnvelope,
  readSecretKey,
} from '@/lib/letter-crypto'
import {
  createEmptyCatalog,
  parseFileCatalog,
  parseWorkingCatalog,
  type Catalog,
  type Company,
  type FileCatalog,
  type FileCompany,
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

export const hydrateFileCatalog = async (
  fileCatalog: FileCatalog,
): Promise<Catalog> => {
  const companies: Company[] = []

  for (const company of fileCatalog.companies) {
    companies.push(await hydrateFileCompany(company))
  }

  return {
    schemaVersion: fileCatalog.schemaVersion,
    companies,
  }
}

const hydrateFileCompany = async (company: FileCompany): Promise<Company> => {
  let coverLetter = ''

  if (company.coverLetter !== '' && isCiphertextEnvelope(company.coverLetter)) {
    coverLetter = (await decryptLetter(company.coverLetter, company.id)) ?? ''
  }

  return {
    ...company,
    coverLetter,
  }
}

export const importFileCatalog = async (data: unknown): Promise<Catalog> => {
  const fileCatalog = parseFileCatalog(data)
  return hydrateFileCatalog(fileCatalog)
}

export const toFileCatalog = async (
  catalog: Catalog,
): Promise<{ fileCatalog: FileCatalog; lettersOmitted: boolean }> => {
  const hasKey = readSecretKey() !== null
  let lettersOmitted = false
  const companies: FileCompany[] = []

  for (const company of catalog.companies) {
    let coverLetter = ''

    if (company.coverLetter.trim() !== '') {
      if (hasKey) {
        coverLetter = await encryptLetter(company.coverLetter, company.id)
      } else {
        lettersOmitted = true
      }
    }

    companies.push({
      id: company.id,
      name: company.name,
      website: company.website,
      email: company.email,
      coverLetter,
      vacancies: company.vacancies,
      vacanciesSource: company.vacanciesSource,
      updatedAt: company.updatedAt,
    })
  }

  return {
    fileCatalog: {
      schemaVersion: catalog.schemaVersion,
      companies,
    },
    lettersOmitted,
  }
}

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
