import { useEffect, useRef } from 'react'
import { isVacancyLink, lastAppliedAtLabel } from '@/lib/vacancies'
import type { Company } from '@/lib/schema'

type CompanyDetailsModalProps = {
  company: Company
  onClose: () => void
  onEdit: () => void
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const getFocusableElements = (root: HTMLElement): HTMLElement[] => {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => element.offsetParent !== null || element === document.activeElement,
  )
}

export const CompanyDetailsModal = ({
  company,
  onClose,
  onEdit,
}: CompanyDetailsModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  const website = company.website?.trim() ?? ''
  const email = company.email?.trim() ?? ''
  const letter = company.coverLetter.trim()
  const titleId = `company-details-title-${company.id}`

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previous = document.activeElement
    closeButtonRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const root = dialogRef.current
      if (!root) {
        return
      }

      const focusable = getFocusableElements(root)
      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (previous instanceof HTMLElement) {
        previous.focus()
      }
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative my-8 w-full max-w-xl rounded-md border border-slate-200 bg-white p-5 shadow-lg"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold">
            {company.name}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Закрыть сведения о компании"
            className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Закрыть
          </button>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-medium text-slate-700">Сайт</dt>
            <dd className="mt-1">
              {website !== '' && isVacancyLink(website) ? (
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-slate-900 underline hover:text-slate-600"
                >
                  {website}
                </a>
              ) : (
                <span className="text-slate-500">Не указан</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">Email</dt>
            <dd className="mt-1">
              {email !== '' ? (
                <a
                  href={`mailto:${email}`}
                  className="break-all text-slate-900 underline hover:text-slate-600"
                >
                  {email}
                </a>
              ) : (
                <span className="text-slate-500">Не указан</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">Сопроводительное письмо</dt>
            <dd className="mt-1 whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 p-3 text-slate-800">
              {letter === '' ? 'Письмо не задано' : company.coverLetter}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">Вакансии</dt>
            <dd className="mt-1">
              {company.vacancies.length === 0 ? (
                <p className="text-slate-500">Вакансий нет.</p>
              ) : (
                <ul className="space-y-2">
                  {company.vacancies.map((vacancy) => (
                    <li key={vacancy.id} className="flex flex-wrap items-baseline gap-x-2">
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
                      <span className="text-xs font-medium text-slate-600">
                        {lastAppliedAtLabel(vacancy.lastAppliedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Редактировать
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
