import { filterVacancies, isVacancyLink } from '@/lib/vacancies'
import type { Vacancy } from '@/lib/schema'

type VacancyListProps = {
  vacancies: Vacancy[]
  isFilterEnabled: boolean
  onToggleFilter: () => void
}

export const VacancyList = ({
  vacancies,
  isFilterEnabled,
  onToggleFilter,
}: VacancyListProps) => {
  const visibleVacancies = filterVacancies(vacancies, isFilterEnabled)

  return (
    <section
      aria-labelledby="vacancies-heading"
      className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="vacancies-heading" className="text-lg font-semibold">
          Вакансии
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFilterEnabled}
            onChange={onToggleFilter}
            aria-label="Фильтр для фронтенда"
          />
          Фильтр для фронтенда
        </label>
      </div>
      {visibleVacancies.length === 0 ? (
        <p className="text-sm text-slate-600">
          {vacancies.length === 0
            ? 'У этой компании нет сохранённых вакансий.'
            : 'Нет вакансий по текущему фильтру. Выключите фильтр, чтобы снова увидеть полный список.'}
        </p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {visibleVacancies.map((vacancy) => (
            <li key={vacancy.id}>
              {isVacancyLink(vacancy.url) ? (
                <a
                  href={vacancy.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-900 underline hover:text-slate-600"
                >
                  {vacancy.title}
                </a>
              ) : (
                <span>{vacancy.title}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
