import { isVacancyLink, lastAppliedAtLabel } from '@/lib/vacancies'
import type { Company } from '@/lib/schema'

type CompanyTableProps = {
  companies: Company[]
  highlightedId: string | null
  onOpenDetails: (companyId: string) => void
  onMarkApplied: (companyId: string, vacancyId: string) => void
}

const stopRowClick = (event: { stopPropagation: () => void }): void => {
  event.stopPropagation()
}

export const CompanyTable = ({
  companies,
  highlightedId,
  onOpenDetails,
  onMarkApplied,
}: CompanyTableProps) => {
  return (
    <section aria-labelledby="company-table-heading" className="space-y-3">
      <h2 id="company-table-heading" className="text-lg font-semibold">
        Обзор компаний
      </h2>
      {companies.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
          Таблица пуста. Добавьте компанию в списке ниже или импортируйте файл.
        </p>
      ) : (
        <div className="overflow-visible rounded-md border border-slate-200 bg-white">
          <table className="min-w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              Компании: клик по строке или имени открывает сведения. Сайт, почта
              и вакансии — ссылки. «Отметка о подаче» сразу сохраняет дату.
            </caption>
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Имя
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Сайт
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Email
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Вакансии
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => {
                const isHighlighted = company.id === highlightedId
                const website = company.website?.trim() ?? ''
                const email = company.email?.trim() ?? ''

                return (
                  <tr
                    key={company.id}
                    onClick={() => {
                      onOpenDetails(company.id)
                    }}
                    className={
                      isHighlighted
                        ? 'cursor-pointer border-t border-slate-200 bg-slate-100 hover:bg-slate-100'
                        : 'cursor-pointer border-t border-slate-200 hover:bg-slate-50'
                    }
                  >
                    <td className="px-3 py-2 align-top">
                      <button
                        type="button"
                        onClick={(event) => {
                          stopRowClick(event)
                          onOpenDetails(company.id)
                        }}
                        aria-haspopup="dialog"
                        aria-label={`Открыть сведения о компании ${company.name}`}
                        className="rounded text-left font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                      >
                        {company.name}
                      </button>
                    </td>
                    <td className="px-3 py-2 align-top">
                      {website !== '' && isVacancyLink(website) ? (
                        <a
                          href={website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={stopRowClick}
                          className="break-all text-slate-900 underline hover:text-slate-600"
                        >
                          {website}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {email !== '' ? (
                        <a
                          href={`mailto:${email}`}
                          onClick={stopRowClick}
                          className="break-all text-slate-900 underline hover:text-slate-600"
                        >
                          {email}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {company.vacancies.length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <ul className="space-y-1">
                          {company.vacancies.map((vacancy) => {
                            const appliedLabel = lastAppliedAtLabel(
                              vacancy.lastAppliedAt,
                            )

                            return (
                              <li
                                key={vacancy.id}
                                className="flex flex-wrap items-center gap-x-2 gap-y-1"
                              >
                                {isVacancyLink(vacancy.url) ? (
                                  <a
                                    href={vacancy.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={stopRowClick}
                                    className="text-slate-900 underline hover:text-slate-600"
                                  >
                                    {vacancy.title}
                                  </a>
                                ) : (
                                  <span>{vacancy.title}</span>
                                )}
                                <span className="text-xs font-medium text-slate-700">
                                  {appliedLabel}
                                </span>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    stopRowClick(event)
                                    onMarkApplied(company.id, vacancy.id)
                                  }}
                                  aria-label={`Отметка о подаче на ${vacancy.title}`}
                                  className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                                >
                                  Отметка о подаче
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
