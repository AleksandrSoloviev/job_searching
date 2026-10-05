import {
  BUILTIN_FRONTEND_KEYWORDS,
  isReactNativeRole,
} from '@/lib/keywords'
import type { Vacancy } from '@/lib/schema'

export const vacancyMatchesKeywords = (
  vacancy: Vacancy,
  keywords: readonly string[],
): boolean => {
  const haystack = `${vacancy.title} ${vacancy.summary ?? ''}`.toLowerCase()

  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))
}

export const filterVacancies = (
  vacancies: Vacancy[],
  isFilterEnabled: boolean,
): Vacancy[] => {
  if (!isFilterEnabled) {
    return vacancies
  }

  return vacancies.filter(
    (vacancy) =>
      vacancyMatchesKeywords(vacancy, BUILTIN_FRONTEND_KEYWORDS) &&
      !isReactNativeRole(vacancy.title, vacancy.summary ?? ''),
  )
}

export const isVacancyLink = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export const lastAppliedAtLabel = (lastAppliedAt: string | undefined): string => {
  const trimmed = lastAppliedAt?.trim() ?? ''
  return trimmed === '' ? 'Отклика не было' : `Отклик ${trimmed}`
}
