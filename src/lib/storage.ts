import { get, set } from 'idb-keyval'
import { parseWorkingCatalog, type Catalog } from '@/lib/schema'

export const CATALOG_STORAGE_KEY = 'job-searching:catalog'

export const QUOTA_ERROR_MESSAGE =
  'Недостаточно места в хранилище браузера. Данные не обрезаны.'

const toStorageError = (error: unknown): Error => {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return new Error(QUOTA_ERROR_MESSAGE)
  }

  if (error instanceof Error) {
    return error
  }

  return new Error('Не удалось сохранить данные в браузере')
}

export const readCatalog = async (): Promise<Catalog | undefined> => {
  const snapshot: unknown = await get(CATALOG_STORAGE_KEY)

  if (snapshot === undefined) {
    return undefined
  }

  return parseWorkingCatalog(snapshot)
}

export const writeCatalog = async (catalog: Catalog): Promise<void> => {
  const parsed = parseWorkingCatalog(catalog)

  try {
    await set(CATALOG_STORAGE_KEY, parsed)
  } catch (error) {
    throw toStorageError(error)
  }
}
