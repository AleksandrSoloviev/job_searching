import { describe, expect, it } from 'vitest'
import {
  createEmptyCatalog,
  parseCatalog,
} from '@/lib/schema'

describe('parseCatalog', () => {
  it('принимает пустой канонический снимок', () => {
    const catalog = parseCatalog(createEmptyCatalog())

    expect(catalog.schemaVersion).toBe('1.0.0')
    expect(catalog.companies).toEqual([])
  })

  it('принимает компанию с вакансией по контракту GrokBot', () => {
    const catalog = parseCatalog({
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

    expect(catalog.companies[0]?.name).toBe('Acme')
    expect(catalog.companies[0]?.vacancies[0]?.url).toBe(
      'https://acme.example/jobs/fe-1',
    )
  })

  it('отклоняет несовместимую мажорную версию', () => {
    expect(() =>
      parseCatalog({ schemaVersion: '2.0.0', companies: [] }),
    ).toThrow('Несовместимая мажорная версия схемы каталога')
  })

  it('отклоняет компанию без имени', () => {
    expect(() =>
      parseCatalog({
        schemaVersion: '1.0.0',
        companies: [{ id: 'x', name: '' }],
      }),
    ).toThrow()
  })
})
