type CatalogPagerProps = {
  pageCount: number
  pageIndex: number
  companyCount: number
  onPageChange: (pageIndex: number) => void
}

const companyCountLabel = (count: number): string => {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return 'компания'
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'компании'
  }

  return 'компаний'
}

export const CatalogPager = ({
  pageCount,
  pageIndex,
  companyCount,
  onPageChange,
}: CatalogPagerProps) => {
  const pageNumber = pageIndex + 1
  const isFirst = pageIndex <= 0
  const isLast = pageIndex >= pageCount - 1

  return (
    <nav
      aria-label="Страницы каталога"
      className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
    >
      <p className="mr-auto text-sm text-slate-700" aria-live="polite">
        Страница {pageNumber} из {pageCount} · {companyCount}{' '}
        {companyCountLabel(companyCount)}
      </p>
      <button
        type="button"
        onClick={() => {
          onPageChange(pageIndex - 1)
        }}
        disabled={isFirst}
        aria-label="Предыдущая страница"
        className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        Назад
      </button>
      {Array.from({ length: pageCount }, (_, index) => {
        const isCurrent = index === pageIndex

        return (
          <button
            type="button"
            key={index}
            onClick={() => {
              onPageChange(index)
            }}
            aria-label={`Страница ${index + 1}`}
            aria-current={isCurrent ? 'page' : undefined}
            className={
              isCurrent
                ? 'rounded bg-slate-900 px-2 py-1 text-sm text-white'
                : 'rounded border border-slate-300 px-2 py-1 text-sm text-slate-800 hover:bg-slate-50'
            }
          >
            {index + 1}
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => {
          onPageChange(pageIndex + 1)
        }}
        disabled={isLast}
        aria-label="Следующая страница"
        className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        Вперёд
      </button>
    </nav>
  )
}
