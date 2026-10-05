import { describe, expect, it } from 'vitest'
import {
  importFileCatalog,
  markVacancyAppliedToday,
  removeCompany,
  toFileCatalog,
  upsertCompany,
} from '@/lib/catalog'
import {
  parseFileCatalog,
  todayIsoDate,
  type Catalog,
  type Company,
} from '@/lib/schema'

const company = (
  overrides: Partial<Company> & Pick<Company, 'id' | 'name'>,
): Company => ({
  website: '',
  email: '',
  coverLetter: '',
  vacancies: [],
  ...overrides,
})

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

  it('ставит сегодняшнюю дату отклика только у выбранной вакансии', () => {
    const catalog: Catalog = {
      schemaVersion: '1.0.0',
      companies: [
        company({
          id: 'acme',
          name: 'Acme',
          vacancies: [
            {
              id: 'fe-1',
              title: 'Frontend Engineer',
              url: 'https://acme.example/jobs/fe-1',
              lastAppliedAt: '',
            },
            {
              id: 'be-1',
              title: 'Backend Engineer',
              url: 'https://acme.example/jobs/be-1',
              lastAppliedAt: '2026-09-01',
            },
          ],
        }),
      ],
    }

    const next = markVacancyAppliedToday(catalog, 'acme', 'fe-1')

    expect(next.companies[0]?.vacancies[0]?.lastAppliedAt).toBe(todayIsoDate())
    expect(next.companies[0]?.vacancies[1]?.lastAppliedAt).toBe('2026-09-01')
  })
})

describe('импорт и экспорт файла', () => {
  it('отклоняет файл без schemaVersion и оставляет смысл отказа', () => {
    expect(() => importFileCatalog({ companies: [] })).toThrow()
  })

  it('отклоняет мажор ≠ 1', () => {
    expect(() =>
      importFileCatalog({ schemaVersion: '2.0.0', companies: [] }),
    ).toThrow('Несовместимая мажорная версия схемы каталога')
  })

  it('отклоняет весь файл при одной битой записи', () => {
    expect(() =>
      importFileCatalog({
        schemaVersion: '1.0.0',
        companies: [
          { id: 'ok', name: 'Ok' },
          { id: 'bad', name: '' },
        ],
      }),
    ).toThrow()
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

  it('принимает письмо обычной строкой', () => {
    const imported = importFileCatalog({
      schemaVersion: '1.0.0',
      companies: [
        {
          id: 'acme',
          name: 'Acme',
          email: 'jobs@acme.example',
          coverLetter: 'Здравствуйте, команда Acme.',
        },
      ],
    })

    expect(imported.companies[0]?.email).toBe('jobs@acme.example')
    expect(imported.companies[0]?.coverLetter).toBe(
      'Здравствуйте, команда Acme.',
    )
  })

  it('сохраняет lastAppliedAt при импорте и экспорте', () => {
    const imported = importFileCatalog({
      schemaVersion: '1.0.0',
      companies: [
        {
          id: 'acme',
          name: 'Acme',
          vacancies: [
            {
              id: 'fe-1',
              title: 'Frontend Engineer',
              url: 'https://acme.example/jobs/fe-1',
              lastAppliedAt: '2026-10-01',
            },
          ],
        },
      ],
    })

    expect(imported.companies[0]?.vacancies[0]?.lastAppliedAt).toBe('2026-10-01')
    expect(toFileCatalog(imported).companies[0]?.vacancies[0]?.lastAppliedAt).toBe(
      '2026-10-01',
    )
  })

  it('экспортирует письмо той же строкой', () => {
    const exported = toFileCatalog({
      schemaVersion: '1.0.0',
      companies: [
        company({
          id: 'acme',
          name: 'Acme',
          coverLetter: 'Текст письма',
        }),
      ],
    })

    expect(exported.companies[0]?.coverLetter).toBe('Текст письма')
  })
})
