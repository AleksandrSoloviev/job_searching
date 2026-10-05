import { describe, expect, it } from 'vitest'
import { filterVacancies } from '@/lib/vacancies'
import type { Vacancy } from '@/lib/schema'

const vacancy = (id: string, title: string, summary = ''): Vacancy => ({
  id,
  title,
  url: `https://jobs.example/${id}`,
  summary,
})

describe('filterVacancies', () => {
  const list = [
    vacancy('1', 'Frontend Engineer'),
    vacancy('2', 'Backend Engineer', 'Java Spring'),
    vacancy('3', 'QA', 'mobile'),
    vacancy('4', 'Разработчик', 'фронтенд'),
  ]

  it('без фильтра возвращает весь список', () => {
    expect(filterVacancies(list, false)).toHaveLength(4)
    expect(list).toHaveLength(4)
  })

  it('с фильтром оставляет совпадения по встроенному набору', () => {
    const filtered = filterVacancies(list, true)

    expect(filtered.map((item) => item.id)).toEqual(['1', '4'])
    expect(list.map((item) => item.id)).toEqual(['1', '2', '3', '4'])
  })

  it('пустой результат фильтра не чистит исходные данные', () => {
    const onlyBackend = [vacancy('2', 'Backend Engineer', 'Java Spring')]
    const filtered = filterVacancies(onlyBackend, true)

    expect(filtered).toEqual([])
    expect(onlyBackend).toHaveLength(1)
  })
})
