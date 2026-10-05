import { describe, expect, it } from 'vitest'
import { createEmptyCatalog, parseFileCatalog, parseWorkingCatalog } from '@/lib/schema'

describe('parseWorkingCatalog', () => {
  it('принимает пустой канонический снимок', () => {
    const catalog = parseWorkingCatalog(createEmptyCatalog())

    expect(catalog.schemaVersion).toBe('1.0.0')
    expect(catalog.companies).toEqual([])
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

    expect(catalog.companies[0]?.coverLetter).toBe('Здравствуйте')
    expect(catalog.companies[0]?.vacancies[0]?.url).toBe(
      'https://acme.example/jobs/fe-1',
    )
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

  it('отклоняет открытый текст письма в файле', () => {
    expect(() =>
      parseFileCatalog({
        schemaVersion: '1.0.0',
        companies: [
          {
            id: 'acme',
            name: 'Acme',
            coverLetter: 'Открытый текст',
          },
        ],
      }),
    ).toThrow()
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

    expect(catalog.companies[0]?.email).toBe('jobs@acme.example')
    expect(catalog.companies[0]?.coverLetter).toBe('')
  })
})
