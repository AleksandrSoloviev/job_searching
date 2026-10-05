import { describe, expect, it } from 'vitest'
import {
  appendImportToCatalog,
  importFileCatalog,
  markVacancyAppliedToday,
  removeCompany,
  toFileCatalog,
  upsertCompany,
} from '@/lib/catalog'
import {
  getActiveCompanies,
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

const makeCatalog = (
  companies: Company[],
  extraPages: Company[][] = [],
  activePageIndex = 0,
): Catalog => ({
  schemaVersion: '1.0.0',
  pages: [
    { id: 'p1', companies },
    ...extraPages.map((pageCompanies, index) => ({
      id: `p${index + 2}`,
      companies: pageCompanies,
    })),
  ],
  activePageIndex,
})

describe('операции каталога', () => {
  it('обновляет компанию с тем же id на текущей странице, не создавая дубль', () => {
    const catalog = makeCatalog(
      [company({ id: 'acme', name: 'Acme' })],
      [[company({ id: 'beta', name: 'Beta' })]],
    )

    const next = upsertCompany(catalog, company({ id: 'acme', name: 'Acme Inc' }))

    expect(getActiveCompanies(next)).toHaveLength(1)
    expect(getActiveCompanies(next)[0]?.name).toBe('Acme Inc')
    expect(next.pages[1]?.companies[0]?.name).toBe('Beta')
  })

  it('удаляет компанию по id только с текущей страницы', () => {
    const catalog = makeCatalog(
      [company({ id: 'acme', name: 'Acme' })],
      [[company({ id: 'acme', name: 'Acme на второй' })]],
    )

    expect(getActiveCompanies(removeCompany(catalog, 'acme'))).toEqual([])
    expect(removeCompany(catalog, 'acme').pages[1]?.companies[0]?.name).toBe(
      'Acme на второй',
    )
  })

  it('ставит сегодняшнюю дату отклика только у выбранной вакансии', () => {
    const catalog = makeCatalog([
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
    ])

    const next = markVacancyAppliedToday(catalog, 'acme', 'fe-1')

    expect(getActiveCompanies(next)[0]?.vacancies[0]?.lastAppliedAt).toBe(
      todayIsoDate(),
    )
    expect(getActiveCompanies(next)[0]?.vacancies[1]?.lastAppliedAt).toBe(
      '2026-09-01',
    )
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

  it('обновляет компанию с тем же id внутри страницы, а не плодит дубль', () => {
    const catalog = parseFileCatalog({
      schemaVersion: '1.0.0',
      companies: [
        { id: 'acme', name: 'Старое' },
        { id: 'acme', name: 'Новое' },
      ],
    })

    expect(getActiveCompanies(catalog)).toHaveLength(1)
    expect(getActiveCompanies(catalog)[0]?.name).toBe('Новое')
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

    expect(getActiveCompanies(imported)[0]?.email).toBe('jobs@acme.example')
    expect(getActiveCompanies(imported)[0]?.coverLetter).toBe(
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

    expect(getActiveCompanies(imported)[0]?.vacancies[0]?.lastAppliedAt).toBe(
      '2026-10-01',
    )
    expect(
      toFileCatalog(imported).pages[0]?.companies[0]?.vacancies[0]?.lastAppliedAt,
    ).toBe('2026-10-01')
  })

  it('сохраняет fameRank при импорте и экспорте и терпит старый JSON без поля', () => {
    const withRank = importFileCatalog({
      schemaVersion: '1.0.0',
      companies: [{ id: 'acme', name: 'Acme', fameRank: 1 }],
    })
    const withoutRank = importFileCatalog({
      schemaVersion: '1.0.0',
      companies: [{ id: 'zebra', name: 'Zebra' }],
    })

    expect(getActiveCompanies(withRank)[0]?.fameRank).toBe(1)
    expect(toFileCatalog(withRank).pages[0]?.companies[0]?.fameRank).toBe(1)
    expect(getActiveCompanies(withoutRank)[0]?.fameRank).toBeUndefined()
    expect(
      toFileCatalog(withoutRank).pages[0]?.companies[0]?.fameRank,
    ).toBeUndefined()
  })

  it('экспортирует письмо той же строкой', () => {
    const exported = toFileCatalog(
      makeCatalog([
        company({
          id: 'acme',
          name: 'Acme',
          coverLetter: 'Текст письма',
        }),
      ]),
    )

    expect(exported.pages[0]?.companies[0]?.coverLetter).toBe('Текст письма')
  })

  it('добавляет плоский импорт как новую страницу, не сливая компании', () => {
    const start = makeCatalog([company({ id: 'acme', name: 'Acme', fameRank: 1 })])
    const next = appendImportToCatalog(start, {
      schemaVersion: '1.0.0',
      companies: [{ id: 'beta', name: 'Beta' }],
    })

    expect(next.pages).toHaveLength(2)
    expect(next.activePageIndex).toBe(1)
    expect(next.pages[0]?.companies.map((item) => item.id)).toEqual(['acme'])
    expect(getActiveCompanies(next).map((item) => item.id)).toEqual(['beta'])
  })

  it('при импорте снимка со страницами дописывает их как отдельные страницы', () => {
    const start = makeCatalog([company({ id: 'acme', name: 'Acme' })])
    const next = appendImportToCatalog(start, {
      schemaVersion: '1.0.0',
      pages: [
        { id: 'old-1', companies: [{ id: 'one', name: 'One' }] },
        { id: 'old-2', companies: [{ id: 'two', name: 'Two' }] },
      ],
    })

    expect(next.pages).toHaveLength(3)
    expect(next.activePageIndex).toBe(1)
    expect(next.pages[1]?.companies[0]?.name).toBe('One')
    expect(next.pages[2]?.companies[0]?.name).toBe('Two')
    expect(next.pages[1]?.id).not.toBe('old-1')
  })
})
