import { describe, expect, it } from 'vitest'
import { filterVacancies } from '@/lib/vacancies'
import type { Vacancy } from '@/lib/schema'

const vacancy = (id: string, title: string, summary = ''): Vacancy => ({
  id,
  title,
  url: `https://jobs.example/${id}`,
  summary,
  lastAppliedAt: '',
})

describe('filterVacancies', () => {
  const list = [
    vacancy('1', 'Frontend Engineer'),
    vacancy('2', 'Backend Engineer', 'Java Spring'),
    vacancy('3', 'QA', 'mobile'),
    vacancy('4', 'Разработчик', 'фронтенд'),
    vacancy('5', 'React Native Engineer'),
    vacancy('6', 'Mobile Developer', 'react-native'),
    vacancy('7', 'Senior RN Engineer', 'TypeScript'),
    vacancy('8', 'Frontend Intern', 'React TypeScript'),
  ]

  it('без фильтра возвращает весь список, включая React Native', () => {
    expect(filterVacancies(list, false)).toHaveLength(8)
    expect(list).toHaveLength(8)
  })

  it('с фильтром оставляет фронтенд и скрывает React Native / RN', () => {
    const filtered = filterVacancies(list, true)

    expect(filtered.map((item) => item.id)).toEqual(['1', '4', '8'])
    expect(list.map((item) => item.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
    ])
  })

  it('пустой результат фильтра не чистит исходные данные', () => {
    const onlyBackend = [vacancy('2', 'Backend Engineer', 'Java Spring')]
    const filtered = filterVacancies(onlyBackend, true)

    expect(filtered).toEqual([])
    expect(onlyBackend).toHaveLength(1)
  })
})
