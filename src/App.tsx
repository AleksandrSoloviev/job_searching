import { useEffect, useState } from 'react'
import { CatalogTransfer } from '@/components/CatalogTransfer'
import { CompanyForm } from '@/components/CompanyForm'
import { CompanyList } from '@/components/CompanyList'
import { DecryptKeyField } from '@/components/DecryptKeyField'
import { VacancyList } from '@/components/VacancyList'
import {
  importFileCatalog,
  loadWorkingCatalog,
  persistCatalog,
  removeCompany,
  resetToPublicSeed,
  toFileCatalog,
  upsertCompany,
} from '@/lib/catalog'
import type { Catalog, Company } from '@/lib/schema'

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

  const selectedCompany =
    catalog?.companies.find((company) => company.id === selectedId) ?? null

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

  const handleDeleteCompany = async (companyId: string): Promise<void> => {
    if (!catalog) {
      return
    }

    const company = catalog.companies.find((item) => item.id === companyId)
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
      setStatus('Компания удалена')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось удалить')
    }
  }

  const handleImportFile = async (file: File): Promise<void> => {
    try {
      const text = await file.text()
      const data: unknown = JSON.parse(text)
      const imported = await importFileCatalog(data)
      await handlePersist(imported)
      setSelectedId(null)
      setIsCreating(false)
      setStatus('Импорт выполнен')
    } catch {
      setStatus('Файл не принят. Рабочая копия не изменена.')
    }
  }

  const handleExportFile = async (): Promise<void> => {
    if (!catalog) {
      return
    }

    try {
      const { fileCatalog, lettersOmitted } = await toFileCatalog(catalog)
      downloadJson('companies.json', fileCatalog)
      setStatus(
        lettersOmitted
          ? 'Экспорт готов. Ключ не задан, поэтому письма в файл не попали.'
          : 'Экспорт готов',
      )
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
      setStatus('Рабочая копия заменена файлом сайта')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось сбросить')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <h1 className="text-xl font-semibold">Трекер целевых компаний</h1>
          <p className="mt-1 text-sm text-slate-500">
            Данные живут в этом браузере. Это не облачная база, серверной
            синхронизации нет.
          </p>
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        {catalog ? (
          <>
            <div className="space-y-4">
              <CompanyList
                companies={catalog.companies}
                selectedId={selectedId}
                onSelect={(companyId) => {
                  setSelectedId(companyId)
                  setIsCreating(false)
                }}
                onCreate={() => {
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
                onExportFile={() => {
                  void handleExportFile()
                }}
                onResetToSeed={() => {
                  void handleResetToSeed()
                }}
              />
              <DecryptKeyField
                onKeyChange={() => {
                  setStatus(
                    'Ключ обновлён только в этом браузере. Чтобы подтянуть письма из файла сайта, сбросьте копию.',
                  )
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
                    key={selectedCompany?.id ?? 'new'}
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
          </>
        ) : (
          <p className="text-sm text-slate-600">Загрузка…</p>
        )}
      </main>
    </div>
  )
}
