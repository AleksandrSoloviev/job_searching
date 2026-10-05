import { get, set } from 'idb-keyval'
import { catalogSchema, type Catalog } from '@/lib/schema'

export const CATALOG_STORAGE_KEY = 'job-searching:catalog'

export const readCatalog = async (): Promise<Catalog | undefined> => {
  const snapshot: unknown = await get(CATALOG_STORAGE_KEY)

  if (snapshot === undefined) {
    return undefined
  }

  return catalogSchema.parse(snapshot)
}

export const writeCatalog = async (catalog: Catalog): Promise<void> => {
  const parsed = catalogSchema.parse(catalog)
  await set(CATALOG_STORAGE_KEY, parsed)
}
