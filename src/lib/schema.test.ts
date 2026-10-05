import { describe, expect, it } from 'vitest'
import {
  createEmptyCatalog,
  getActiveCompanies,
  parseFileCatalog,
  parseWorkingCatalog,
  SEED_PAGE_ID,
} from '@/lib/schema'

describe('parseWorkingCatalog', () => {
  it('принимает пустой канонический снимок', () => {
    const catalog = parseWorkingCatalog(createEmptyCatalog())

    expect(catalog.schemaVersion).toBe('1.0.0')
    expect(catalog.pages).toHaveLength(1)
    expect(getActiveCompanies(catalog)).toEqual([])
  })

  it('принимает компанию с письмом и вакансией', () => {
    const catalog = parseWorkingCatalog({
      schemaVersion: '1.0.0',
      companies: [
        {
          id: 'acme',
          name: 'Acme',
          website: 'https://acme.example',
          email: 'jobs@acme.example',
          coverLetter: 'Здравствуйте',
          vacancies: [
            {
              id: 'fe-1',
              title: 'Frontend Engineer',
              url: 'https://acme.example/jobs/fe-1',
            },
          ],
        },
      ],
    })

    expect(getActiveCompanies(catalog)[0]?.coverLetter).toBe('Здравствуйте')
    expect(getActiveCompanies(catalog)[0]?.vacancies[0]?.url).toBe(
      'https://acme.example/jobs/fe-1',
    )
  })

  it('оборачивает старый плоский каталог в одну страницу', () => {
    const catalog = parseWorkingCatalog({
      schemaVersion: '1.0.0',
      companies: [{ id: 'acme', name: 'Acme' }],
    })

    expect(catalog.pages).toHaveLength(1)
    expect(catalog.pages[0]?.id).toBe(SEED_PAGE_ID)
    expect(catalog.activePageIndex).toBe(0)
    expect(getActiveCompanies(catalog)[0]?.name).toBe('Acme')
  })

  it('читает страницы и ограничивает activePageIndex', () => {
    const catalog = parseWorkingCatalog({
      schemaVersion: '1.0.0',
      activePageIndex: 40,
      pages: [
        { id: 'p1', companies: [{ id: 'acme', name: 'Acme' }] },
        { id: 'p2', companies: [{ id: 'beta', name: 'Beta' }] },
      ],
    })

    expect(catalog.pages).toHaveLength(2)
    expect(catalog.activePageIndex).toBe(1)
    expect(getActiveCompanies(catalog)[0]?.name).toBe('Beta')
  })

  it('отклоняет несовместимую мажорную версию', () => {
    expect(() =>
      parseWorkingCatalog({ schemaVersion: '2.0.0', companies: [] }),
    ).toThrow('Несовместимая мажорная версия схемы каталога')
  })

  it('отклоняет компанию без имени', () => {
    expect(() =>
      parseWorkingCatalog({
        schemaVersion: '1.0.0',
        companies: [{ id: 'x', name: '' }],
      }),
    ).toThrow()
  })
})

describe('parseFileCatalog', () => {
  it('отклоняет файл без schemaVersion', () => {
    expect(() => parseFileCatalog({ companies: [] })).toThrow()
  })

  it('отклоняет мажор ≠ 1', () => {
    expect(() =>
      parseFileCatalog({ schemaVersion: '2.0.0', companies: [] }),
    ).toThrow('Несовместимая мажорная версия схемы каталога')
  })

  it('отклоняет пустой id', () => {
    expect(() =>
      parseFileCatalog({
        schemaVersion: '1.0.0',
        companies: [{ id: '', name: 'Acme' }],
      }),
    ).toThrow()
  })

  it('отклоняет битый URL и email', () => {
    expect(() =>
      parseFileCatalog({
        schemaVersion: '1.0.0',
        companies: [
          {
            id: 'acme',
            name: 'Acme',
            website: 'not-a-url',
          },
        ],
      }),
    ).toThrow()

    expect(() =>
      parseFileCatalog({
        schemaVersion: '1.0.0',
        companies: [
          {
            id: 'acme',
            name: 'Acme',
            email: 'not-an-email',
          },
        ],
      }),
    ).toThrow()
  })

  it('отклоняет вакансию без обязательных полей', () => {
    expect(() =>
      parseFileCatalog({
        schemaVersion: '1.0.0',
        companies: [
          {
            id: 'acme',
            name: 'Acme',
            vacancies: [{ id: 'v1', title: 'Dev' }],
          },
        ],
      }),
    ).toThrow()
  })

  it('принимает письмо обычной строкой в файле', () => {
    const catalog = parseFileCatalog({
      schemaVersion: '1.0.0',
      companies: [
        {
          id: 'acme',
          name: 'Acme',
          coverLetter: 'Открытый текст',
        },
      ],
    })

    expect(getActiveCompanies(catalog)[0]?.coverLetter).toBe('Открытый текст')
  })

  it('принимает email и пустое письмо', () => {
    const catalog = parseFileCatalog({
      schemaVersion: '1.0.0',
      companies: [
        {
          id: 'acme',
          name: 'Acme',
          email: 'jobs@acme.example',
          coverLetter: '',
        },
      ],
    })

    expect(getActiveCompanies(catalog)[0]?.email).toBe('jobs@acme.example')
    expect(getActiveCompanies(catalog)[0]?.coverLetter).toBe('')
  })

  it('принимает lastAppliedAt как YYYY-MM-DD или пустую строку', () => {
    const catalog = parseFileCatalog({
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
            {
              id: 'be-1',
              title: 'Backend Engineer',
              url: 'https://acme.example/jobs/be-1',
              lastAppliedAt: '',
            },
          ],
        },
      ],
    })

    expect(getActiveCompanies(catalog)[0]?.vacancies[0]?.lastAppliedAt).toBe(
      '2026-10-01',
    )
    expect(getActiveCompanies(catalog)[0]?.vacancies[1]?.lastAppliedAt).toBe('')
  })

  it('подставляет пустой lastAppliedAt, если поля нет', () => {
    const catalog = parseFileCatalog({
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
            },
          ],
        },
      ],
    })

    expect(getActiveCompanies(catalog)[0]?.vacancies[0]?.lastAppliedAt).toBe('')
  })

  it('принимает fameRank и не ломается, если поля нет', () => {
    const withRank = parseFileCatalog({
      schemaVersion: '1.0.0',
      companies: [
        {
          id: 'acme',
          name: 'Acme',
          fameRank: 1,
        },
      ],
    })
    const withoutRank = parseFileCatalog({
      schemaVersion: '1.0.0',
      companies: [{ id: 'zebra', name: 'Zebra' }],
    })

    expect(getActiveCompanies(withRank)[0]?.fameRank).toBe(1)
    expect(getActiveCompanies(withoutRank)[0]?.fameRank).toBeUndefined()
  })

  it('отклоняет нечисловой fameRank', () => {
    expect(() =>
      parseFileCatalog({
        schemaVersion: '1.0.0',
        companies: [{ id: 'acme', name: 'Acme', fameRank: 'top' }],
      }),
    ).toThrow()
  })

  it('отклоняет lastAppliedAt не в формате YYYY-MM-DD', () => {
    expect(() =>
      parseFileCatalog({
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
                lastAppliedAt: '01.10.2026',
              },
            ],
          },
        ],
      }),
    ).toThrow()

    expect(() =>
      parseFileCatalog({
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
                lastAppliedAt: '2026-13-40',
              },
            ],
          },
        ],
      }),
    ).toThrow()
  })
})
