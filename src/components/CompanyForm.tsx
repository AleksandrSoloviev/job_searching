import { useState } from 'react'
import {
  createCompanyId,
  createVacancyId,
  todayIsoDate,
  workingCompanySchema,
  type Company,
  type Vacancy,
} from '@/lib/schema'

type CompanyFormProps = {
  company: Company | null
  onSave: (company: Company) => void
}

type Draft = {
  name: string
  website: string
  email: string
  coverLetter: string
  fameRank: string
  vacancyTitle: string
  vacancyUrl: string
  vacancies: Vacancy[]
}

type FieldErrors = {
  name?: string
  website?: string
  email?: string
  fameRank?: string
  vacancy?: string
}

const toDraft = (company: Company | null): Draft => ({
  name: company?.name ?? '',
  website: company?.website ?? '',
  email: company?.email ?? '',
  coverLetter: company?.coverLetter ?? '',
  fameRank:
    typeof company?.fameRank === 'number' ? String(company.fameRank) : '',
  vacancyTitle: '',
  vacancyUrl: '',
  vacancies: company?.vacancies ?? [],
})

export const CompanyForm = ({ company, onSave }: CompanyFormProps) => {
  const [draft, setDraft] = useState<Draft>(() => toDraft(company))
  const [errors, setErrors] = useState<FieldErrors>({})

  const handleAddVacancy = () => {
    const title = draft.vacancyTitle.trim()
    const url = draft.vacancyUrl.trim()

    if (!title || !url) {
      setErrors({ vacancy: 'Для вакансии нужны название и адрес страницы' })
      return
    }

    try {
      new URL(url)
    } catch {
      setErrors({ vacancy: 'Адрес вакансии должен быть корректным URL' })
      return
    }

    setDraft({
      ...draft,
      vacancies: [
        ...draft.vacancies,
        {
          id: createVacancyId(),
          title,
          url,
          lastAppliedAt: '',
        },
      ],
      vacancyTitle: '',
      vacancyUrl: '',
    })
    setErrors({})
  }

  const handleSave = () => {
    let vacancies = draft.vacancies
    const pendingTitle = draft.vacancyTitle.trim()
    const pendingUrl = draft.vacancyUrl.trim()

    if (pendingTitle || pendingUrl) {
      if (!pendingTitle || !pendingUrl) {
        setErrors({ vacancy: 'Для вакансии нужны название и адрес страницы' })
        return
      }

      try {
        new URL(pendingUrl)
      } catch {
        setErrors({ vacancy: 'Адрес вакансии должен быть корректным URL' })
        return
      }

      vacancies = [
        ...vacancies,
        {
          id: createVacancyId(),
          title: pendingTitle,
          url: pendingUrl,
          lastAppliedAt: '',
        },
      ]
    }

    const fameRankRaw = draft.fameRank.trim()
    let fameRank: number | undefined

    if (fameRankRaw !== '') {
      const parsedRank = Number(fameRankRaw)

      if (!Number.isFinite(parsedRank)) {
        setErrors({ fameRank: 'Ранг известности должен быть числом' })
        return
      }

      fameRank = parsedRank
    }

    const parsed = workingCompanySchema.safeParse({
      id: company?.id ?? createCompanyId(),
      name: draft.name.trim(),
      website: draft.website.trim(),
      email: draft.email.trim(),
      coverLetter: draft.coverLetter,
      fameRank,
      vacancies,
      vacanciesSource: company?.vacanciesSource,
      updatedAt: new Date().toISOString(),
    })

    if (!parsed.success) {
      const nextErrors: FieldErrors = {}

      for (const issue of parsed.error.issues) {
        const field = issue.path[0]

        if (field === 'name') {
          nextErrors.name = 'Имя обязательно'
        }

        if (field === 'website') {
          nextErrors.website = 'Сайт должен быть корректным URL или пустым'
        }

        if (field === 'email') {
          nextErrors.email = 'Email должен быть корректным или пустым'
        }

        if (field === 'fameRank') {
          nextErrors.fameRank = 'Ранг известности должен быть числом'
        }
      }

      setErrors(nextErrors)
      return
    }

    setErrors({})
    onSave(parsed.data)
  }

  return (
    <form
      className="space-y-4 rounded-md border border-slate-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault()
        handleSave()
      }}
    >
      <h2 className="text-lg font-semibold">
        {company ? company.name : 'Новая компания'}
      </h2>
      <div className="space-y-1">
        <label htmlFor="company-name" className="text-sm font-medium">
          Имя
        </label>
        <input
          id="company-name"
          value={draft.name}
          onChange={(event) => {
            setDraft({ ...draft, name: event.target.value })
          }}
          required
          aria-invalid={errors.name ? true : undefined}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.name ? (
          <p role="alert" className="text-sm text-red-700">
            {errors.name}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label htmlFor="company-website" className="text-sm font-medium">
          Сайт
        </label>
        <input
          id="company-website"
          type="url"
          value={draft.website}
          onChange={(event) => {
            setDraft({ ...draft, website: event.target.value })
          }}
          aria-invalid={errors.website ? true : undefined}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.website ? (
          <p role="alert" className="text-sm text-red-700">
            {errors.website}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label htmlFor="company-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="company-email"
          type="email"
          value={draft.email}
          onChange={(event) => {
            setDraft({ ...draft, email: event.target.value })
          }}
          aria-invalid={errors.email ? true : undefined}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.email ? (
          <p role="alert" className="text-sm text-red-700">
            {errors.email}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label htmlFor="company-fame-rank" className="text-sm font-medium">
          Ранг известности
        </label>
        <input
          id="company-fame-rank"
          inputMode="numeric"
          value={draft.fameRank}
          onChange={(event) => {
            setDraft({ ...draft, fameRank: event.target.value })
          }}
          aria-invalid={errors.fameRank ? true : undefined}
          aria-describedby="company-fame-rank-hint"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <p id="company-fame-rank-hint" className="text-xs text-slate-500">
          Меньше — компания известнее и выше в таблице и списке. Пусто — в
          конец.
        </p>
        {errors.fameRank ? (
          <p role="alert" className="text-sm text-red-700">
            {errors.fameRank}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label htmlFor="company-letter" className="text-sm font-medium">
          Сопроводительное письмо
        </label>
        <textarea
          id="company-letter"
          value={draft.coverLetter}
          onChange={(event) => {
            setDraft({ ...draft, coverLetter: event.target.value })
          }}
          rows={8}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-500">
          Чтобы скопировать письмо, выделите текст в поле. Отдельной кнопки нет.
        </p>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Вакансии</legend>
        {draft.vacancies.length === 0 ? (
          <p className="text-sm text-slate-500">Вакансий пока нет.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {draft.vacancies.map((vacancy) => {
              const appliedId = `vacancy-applied-${vacancy.id}`
              const appliedValue = vacancy.lastAppliedAt ?? ''

              return (
                <li
                  key={vacancy.id}
                  className="space-y-2 rounded border border-slate-200 p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{vacancy.title}</span>
                    <button
                      type="button"
                      aria-label={`Убрать вакансию ${vacancy.title}`}
                      onClick={() => {
                        setDraft({
                          ...draft,
                          vacancies: draft.vacancies.filter(
                            (item) => item.id !== vacancy.id,
                          ),
                        })
                      }}
                      className="text-red-700 hover:underline"
                    >
                      Убрать
                    </button>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1">
                      <label htmlFor={appliedId} className="text-xs text-slate-600">
                        Последний отклик
                      </label>
                      <input
                        id={appliedId}
                        type="date"
                        value={appliedValue}
                        onChange={(event) => {
                          setDraft({
                            ...draft,
                            vacancies: draft.vacancies.map((item) =>
                              item.id === vacancy.id
                                ? { ...item, lastAppliedAt: event.target.value }
                                : item,
                            ),
                          })
                        }}
                        aria-label={`Дата последнего отклика на ${vacancy.title}`}
                        className="rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={`Отметить сегодняшний отклик на ${vacancy.title}`}
                      onClick={() => {
                        setDraft({
                          ...draft,
                          vacancies: draft.vacancies.map((item) =>
                            item.id === vacancy.id
                              ? { ...item, lastAppliedAt: todayIsoDate() }
                              : item,
                          ),
                        })
                      }}
                      className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
                    >
                      Отметить сегодня
                    </button>
                    <button
                      type="button"
                      aria-label={`Сбросить дату отклика на ${vacancy.title}`}
                      onClick={() => {
                        setDraft({
                          ...draft,
                          vacancies: draft.vacancies.map((item) =>
                            item.id === vacancy.id
                              ? { ...item, lastAppliedAt: '' }
                              : item,
                          ),
                        })
                      }}
                      className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
                    >
                      Сбросить дату
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            aria-label="Название вакансии"
            placeholder="Название"
            value={draft.vacancyTitle}
            onChange={(event) => {
              setDraft({ ...draft, vacancyTitle: event.target.value })
            }}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            aria-label="Адрес страницы вакансии"
            placeholder="https://"
            value={draft.vacancyUrl}
            onChange={(event) => {
              setDraft({ ...draft, vacancyUrl: event.target.value })
            }}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {errors.vacancy ? (
          <p role="alert" className="text-sm text-red-700">
            {errors.vacancy}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleAddVacancy}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Добавить вакансию
        </button>
      </fieldset>
      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
      >
        Сохранить
      </button>
    </form>
  )
}
