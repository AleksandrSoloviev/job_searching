import type { Company } from '@/lib/schema'

type CompanyListProps = {
  companies: Company[]
  selectedId: string | null
  onSelect: (companyId: string) => void
  onCreate: () => void
  onDelete: (companyId: string) => void
}

export const CompanyList = ({
  companies,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
}: CompanyListProps) => {
  return (
    <section aria-labelledby="company-list-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="company-list-heading" className="text-lg font-semibold">
          Компании
        </h2>
        <button
          type="button"
          onClick={onCreate}
          aria-label="Добавить компанию"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
        >
          Добавить
        </button>
      </div>
      {companies.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
          Список пуст. Добавьте первую компанию или импортируйте файл.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-md border border-slate-200 bg-white">
          {companies.map((company) => {
            const isSelected = company.id === selectedId

            return (
              <li key={company.id} className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(company.id)
                  }}
                  aria-current={isSelected ? 'true' : undefined}
                  aria-label={`Открыть компанию ${company.name}`}
                  className={
                    isSelected
                      ? 'flex-1 rounded px-2 py-1 text-left text-sm font-medium bg-slate-900 text-white'
                      : 'flex-1 rounded px-2 py-1 text-left text-sm text-slate-800 hover:bg-slate-100'
                  }
                >
                  {company.name}
                </button>
                <button
                  type="button"
                  aria-label={`Удалить компанию ${company.name}`}
                  onClick={() => {
                    onDelete(company.id)
                  }}
                  className="rounded px-2 py-1 text-sm text-red-700 hover:bg-red-50"
                >
                  Удалить
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
