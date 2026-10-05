import { describe, expect, it } from 'vitest'
import { sortCompaniesByFame } from '@/lib/companies'
import type { Company } from '@/lib/schema'

const company = (
  overrides: Partial<Company> & Pick<Company, 'id' | 'name'>,
): Company => ({
  website: '',
  email: '',
  coverLetter: '',
  vacancies: [],
  ...overrides,
})

describe('sortCompaniesByFame', () => {
  it('ставит известные выше, без поля — в конец, при равенстве — по имени', () => {
    const zebra = company({ id: 'zebra', name: 'Zebra' })
    const northwind = company({ id: 'northwind', name: 'Northwind', fameRank: 10 })
    const acme = company({ id: 'acme', name: 'Acme', fameRank: 1 })
    const beacon = company({ id: 'beacon', name: 'Beacon', fameRank: 10 })

    const sorted = sortCompaniesByFame([zebra, northwind, acme, beacon])

    expect(sorted.map((item) => item.id)).toEqual([
      'acme',
      'beacon',
      'northwind',
      'zebra',
    ])
  })

  it('не мутирует исходный массив', () => {
    const companies = [
      company({ id: 'zebra', name: 'Zebra' }),
      company({ id: 'acme', name: 'Acme', fameRank: 1 }),
    ]
    const snapshot = [...companies]

    sortCompaniesByFame(companies)

    expect(companies.map((item) => item.id)).toEqual(snapshot.map((item) => item.id))
  })
})
