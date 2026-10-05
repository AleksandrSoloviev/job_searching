type CatalogTransferProps = {
  onImportFile: (file: File) => void
  onExportFile: () => void
  onResetToSeed: () => void
}

export const CatalogTransfer = ({
  onImportFile,
  onExportFile,
  onResetToSeed,
}: CatalogTransferProps) => {
  return (
    <section
      aria-labelledby="transfer-heading"
      className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
    >
      <h2 id="transfer-heading" className="text-lg font-semibold">
        Импорт и экспорт
      </h2>
      <p className="text-sm text-slate-600">
        Данные живут в этом браузере. Это не облачная база: между устройствами
        ничего не синхронизируется.
      </p>
      <p className="text-sm text-slate-600">
        GrokBot пишет плоский JSON компаний. Каждый успешный импорт — новая
        страница, без слияния с уже открытыми. Экспорт сохраняет все страницы.
        Сброс оставляет только файл сайта как страницу 1.
      </p>
      <div className="flex flex-wrap gap-2">
        <label className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
          Импортировать JSON
          <input
            type="file"
            accept="application/json,.json"
            aria-label="Импортировать JSON"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                onImportFile(file)
              }
              event.target.value = ''
            }}
          />
        </label>
        <button
          type="button"
          onClick={onExportFile}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Экспортировать JSON
        </button>
        <button
          type="button"
          onClick={onResetToSeed}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Сбросить к файлу сайта
        </button>
      </div>
    </section>
  )
}
