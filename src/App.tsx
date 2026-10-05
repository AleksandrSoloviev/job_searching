import { useEffect, useState } from 'react'
import { CatalogPager } from '@/components/CatalogPager'
import { CatalogTransfer } from '@/components/CatalogTransfer'
import { CompanyDetailsModal } from '@/components/CompanyDetailsModal'
import { CompanyForm } from '@/components/CompanyForm'
import { CompanyList } from '@/components/CompanyList'
import { CompanyTable } from '@/components/CompanyTable'
import { VacancyList } from '@/components/VacancyList'
import {
  appendImportToCatalog,
  loadWorkingCatalog,
  markVacancyAppliedToday,
  persistCatalog,
  removeCompany,
  resetToPublicSeed,
  toFileCatalog,
  upsertCompany,
} from '@/lib/catalog'
import { sortCompaniesByFame } from '@/lib/companies'
import {
  getActiveCompanies,
  setActivePageIndex,
  type Catalog,
  type Company,
} from '@/lib/schema'

const downloadJson = (filename: string, payload: unknown): void => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const App = () => {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [isFilterEnabled, setIsFilterEnabled] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const nextCatalog = await loadWorkingCatalog()
        setCatalog(nextCatalog)
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : 'Не удалось загрузить данные',
        )
      }
    }

    void load()
  }, [])

  const activeCompanies = catalog ? getActiveCompanies(catalog) : []
  const sortedCompanies = sortCompaniesByFame(activeCompanies)
  const selectedCompany =
    activeCompanies.find((company) => company.id === selectedId) ?? null
  const previewCompany =
    activeCompanies.find((company) => company.id === previewId) ?? null

  const handleSelectCompany = (companyId: string): void => {
    setPreviewId(null)
    setSelectedId(companyId)
    setIsCreating(false)
  }

  const handleOpenDetails = (companyId: string): void => {
    setPreviewId(companyId)
  }

  const handleCloseDetails = (): void => {
    setPreviewId(null)
  }

  const handleEditFromDetails = (): void => {
    if (!previewId) {
      return
    }

    setSelectedId(previewId)
    setIsCreating(false)
    setPreviewId(null)
  }

  const handlePersist = async (next: Catalog): Promise<void> => {
    const saved = await persistCatalog(next)
    setCatalog(saved)
  }

  const handleSaveCompany = async (company: Company): Promise<void> => {
    if (!catalog) {
      return
    }

    try {
      await handlePersist(upsertCompany(catalog, company))
      setSelectedId(company.id)
      setIsCreating(false)
      setStatus('Компания сохранена в браузере')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось сохранить')
    }
  }

  const handleMarkApplied = async (
    companyId: string,
    vacancyId: string,
  ): Promise<void> => {
    if (!catalog) {
      return
    }

    try {
      await handlePersist(
        markVacancyAppliedToday(catalog, companyId, vacancyId),
      )
      setStatus('Отметка о подаче сохранена в браузере')
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : 'Не удалось сохранить отметку о подаче',
      )
    }
  }

  const handleDeleteCompany = async (companyId: string): Promise<void> => {
    if (!catalog) {
      return
    }

    const company = activeCompanies.find((item) => item.id === companyId)
    const confirmed = window.confirm(
      `Удалить компанию «${company?.name ?? companyId}»?`,
    )

    if (!confirmed) {
      return
    }

    try {
      await handlePersist(removeCompany(catalog, companyId))
      if (selectedId === companyId) {
        setSelectedId(null)
        setIsCreating(false)
      }
      if (previewId === companyId) {
        setPreviewId(null)
      }
      setStatus('Компания удалена')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось удалить')
    }
  }

  const handleImportFile = async (file: File): Promise<void> => {
    if (!catalog) {
      return
    }

    try {
      const text = await file.text()
      const data: unknown = JSON.parse(text)
      const imported = appendImportToCatalog(catalog, data)
      await handlePersist(imported)
      setSelectedId(null)
      setIsCreating(false)
      setPreviewId(null)
      setStatus(
        `Импорт выполнен. Открыта страница ${imported.activePageIndex + 1} из ${imported.pages.length}.`,
      )
    } catch {
      setStatus('Файл не принят. Рабочая копия не изменена.')
    }
  }

  const handleExportFile = (): void => {
    if (!catalog) {
      return
    }

    try {
      const fileCatalog = toFileCatalog(catalog)
      downloadJson('companies.json', fileCatalog)
      setStatus('Экспорт готов: все страницы каталога.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось экспортировать')
    }
  }

  const handleResetToSeed = async (): Promise<void> => {
    try {
      const seed = await resetToPublicSeed()
      setCatalog(seed)
      setSelectedId(null)
      setIsCreating(false)
      setPreviewId(null)
      setStatus('Рабочая копия заменена файлом сайта как страницей 1.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось сбросить')
    }
  }

  const handlePageChange = (pageIndex: number): void => {
    if (!catalog) {
      return
    }

    const next = setActivePageIndex(catalog, pageIndex)
    void handlePersist(next)
    setSelectedId(null)
    setIsCreating(false)
    setPreviewId(null)
    setStatus(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-xl font-semibold">Трекер целевых компаний</h1>
          <p className="mt-1 text-sm text-slate-500">
            Данные живут в этом браузере. Это не облачная база, серверной
            синхронизации нет.
          </p>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        {catalog ? (
          <>
            <CatalogPager
              pageCount={catalog.pages.length}
              pageIndex={catalog.activePageIndex}
              companyCount={activeCompanies.length}
              onPageChange={handlePageChange}
            />
            <CompanyTable
              companies={sortedCompanies}
              highlightedId={previewId ?? selectedId}
              onOpenDetails={handleOpenDetails}
              onMarkApplied={(companyId, vacancyId) => {
                void handleMarkApplied(companyId, vacancyId)
              }}
            />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
              <div className="space-y-4">
                <CompanyList
                  companies={sortedCompanies}
                  selectedId={selectedId}
                  onSelect={handleSelectCompany}
                  onCreate={() => {
                    setPreviewId(null)
                    setSelectedId(null)
                    setIsCreating(true)
                  }}
                  onDelete={(companyId) => {
                    void handleDeleteCompany(companyId)
                  }}
                />
                <CatalogTransfer
                  onImportFile={(file) => {
                    void handleImportFile(file)
                  }}
                  onExportFile={handleExportFile}
                  onResetToSeed={() => {
                    void handleResetToSeed()
                  }}
                />
              </div>
              <div className="space-y-4">
                {status ? (
                  <p role="status" className="text-sm text-slate-700">
                    {status}
                  </p>
                ) : null}
                {isCreating || selectedCompany ? (
                  <>
                    <CompanyForm
                      key={
                        selectedCompany
                          ? `${selectedCompany.id}:${selectedCompany.vacancies
                              .map(
                                (vacancy) =>
                                  `${vacancy.id}:${vacancy.lastAppliedAt ?? ''}`,
                              )
                              .join(',')}`
                          : 'new'
                      }
                      company={selectedCompany}
                      onSave={(company) => {
                        void handleSaveCompany(company)
                      }}
                    />
                    {selectedCompany ? (
                      <VacancyList
                        vacancies={selectedCompany.vacancies}
                        isFilterEnabled={isFilterEnabled}
                        onToggleFilter={() => {
                          setIsFilterEnabled(!isFilterEnabled)
                        }}
                      />
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-slate-600">
                    Выберите компанию или добавьте новую.
                  </p>
                )}
              </div>
            </div>
            {previewCompany ? (
              <CompanyDetailsModal
                company={previewCompany}
                onClose={handleCloseDetails}
                onEdit={handleEditFromDetails}
              />
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-600">Загрузка…</p>
        )}
      </main>
    </div>
  )
}
