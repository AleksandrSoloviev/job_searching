import { beforeEach, describe, expect, it } from 'vitest'
import {
  importFileCatalog,
  removeCompany,
  toFileCatalog,
  upsertCompany,
} from '@/lib/catalog'
import {
  encryptLetter,
  SECRET_KEY_NAME,
  writeSecretKey,
} from '@/lib/letter-crypto'
import { parseFileCatalog, type Catalog, type Company } from '@/lib/schema'

const company = (
  overrides: Partial<Company> & Pick<Company, 'id' | 'name'>,
): Company => ({
  website: '',
  email: '',
  coverLetter: '',
  vacancies: [],
  ...overrides,
})

const createTestPassphrase = (): string => `test-${crypto.randomUUID()}`

describe('операции каталога', () => {
  it('обновляет компанию с тем же id, не создавая дубль', () => {
    const catalog: Catalog = {
      schemaVersion: '1.0.0',
      companies: [company({ id: 'acme', name: 'Acme' })],
    }

    const next = upsertCompany(catalog, company({ id: 'acme', name: 'Acme Inc' }))

    expect(next.companies).toHaveLength(1)
    expect(next.companies[0]?.name).toBe('Acme Inc')
  })

  it('удаляет компанию по id', () => {
    const catalog: Catalog = {
      schemaVersion: '1.0.0',
      companies: [company({ id: 'acme', name: 'Acme' })],
    }

    expect(removeCompany(catalog, 'acme').companies).toEqual([])
  })
})

describe('импорт файла', () => {
  beforeEach(() => {
    localStorage.removeItem(SECRET_KEY_NAME)
  })

  it('отклоняет файл без schemaVersion и оставляет смысл отказа', async () => {
    await expect(importFileCatalog({ companies: [] })).rejects.toThrow()
  })

  it('отклоняет мажор ≠ 1', async () => {
    await expect(
      importFileCatalog({ schemaVersion: '2.0.0', companies: [] }),
    ).rejects.toThrow('Несовместимая мажорная версия схемы каталога')
  })

  it('отклоняет весь файл при одной битой записи', async () => {
    await expect(
      importFileCatalog({
        schemaVersion: '1.0.0',
        companies: [
          { id: 'ok', name: 'Ok' },
          { id: 'bad', name: '' },
        ],
      }),
    ).rejects.toThrow()
  })

  it('обновляет компанию с тем же id, а не плодит дубль', () => {
    const catalog = parseFileCatalog({
      schemaVersion: '1.0.0',
      companies: [
        { id: 'acme', name: 'Старое' },
        { id: 'acme', name: 'Новое' },
      ],
    })

    expect(catalog.companies).toHaveLength(1)
    expect(catalog.companies[0]?.name).toBe('Новое')
  })

  it('принимает конверт без ключа и не показывает письмо', async () => {
    writeSecretKey(createTestPassphrase())
    const envelope = await encryptLetter('Секретное письмо', 'acme')
    localStorage.removeItem(SECRET_KEY_NAME)

    const imported = await importFileCatalog({
      schemaVersion: '1.0.0',
      companies: [
        {
          id: 'acme',
          name: 'Acme',
          email: 'jobs@acme.example',
          coverLetter: envelope,
        },
      ],
    })

    expect(imported.companies[0]?.name).toBe('Acme')
    expect(imported.companies[0]?.email).toBe('jobs@acme.example')
    expect(imported.companies[0]?.coverLetter).toBe('')
  })

  it('не показывает письмо, если конверт не расшифровался', async () => {
    writeSecretKey(createTestPassphrase())
    const envelope = await encryptLetter('Секретное письмо', 'acme')
    writeSecretKey(createTestPassphrase())

    const imported = await importFileCatalog({
      schemaVersion: '1.0.0',
      companies: [
        {
          id: 'acme',
          name: 'Acme',
          coverLetter: envelope,
        },
      ],
    })

    expect(imported.companies[0]?.coverLetter).toBe('')
  })

  it('отклоняет открытый текст письма в файле', async () => {
    await expect(
      importFileCatalog({
        schemaVersion: '1.0.0',
        companies: [
          {
            id: 'acme',
            name: 'Acme',
            coverLetter: 'Открытый текст',
          },
        ],
      }),
    ).rejects.toThrow()
  })

  it('при экспорте без ключа не пишет открытые письма', async () => {
    const exported = await toFileCatalog({
      schemaVersion: '1.0.0',
      companies: [
        company({
          id: 'acme',
          name: 'Acme',
          coverLetter: 'Нельзя в файл',
        }),
      ],
    })

    expect(exported.lettersOmitted).toBe(true)
    expect(exported.fileCatalog.companies[0]?.coverLetter).toBe('')
  })
})
