import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '@/App'
import { todayIsoDate } from '@/lib/schema'

vi.mock('@/lib/storage', () => ({
  CATALOG_STORAGE_KEY: 'job-searching:catalog',
  QUOTA_ERROR_MESSAGE:
    'Недостаточно места в хранилище браузера. Данные не обрезаны.',
  readCatalog: async () => undefined,
  writeCatalog: async () => undefined,
}))

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ schemaVersion: '1.0.0', companies: [] }),
      }),
    )
  })

  it('показывает пустое состояние и добавляет компанию по имени', async () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Трекер целевых компаний' }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/Список пуст/i)).toBeInTheDocument()
      expect(screen.getByText(/Таблица пуста/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Добавить компанию' }))
    fireEvent.change(screen.getByLabelText('Имя'), {
      target: { value: 'Acme' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Открыть компанию Acme' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {
          name: 'Открыть сведения о компании Acme',
        }),
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Открыть компанию Acme' }))
    expect(screen.getByLabelText('Имя')).toHaveValue('Acme')
  })

  it('открывает модалку по строке таблицы и редактирование из неё', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          schemaVersion: '1.0.0',
          companies: [
            {
              id: 'acme',
              name: 'Acme',
              website: 'https://acme.example',
              email: 'jobs@acme.example',
              coverLetter: 'Письмо для Acme',
              vacancies: [
                {
                  id: 'fe-1',
                  title: 'Frontend Engineer',
                  url: 'https://acme.example/jobs/fe-1',
                  lastAppliedAt: '2026-10-01',
                },
              ],
            },
          ],
        }),
      }),
    )

    render(<App />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: 'Открыть сведения о компании Acme',
        }),
      ).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Открыть сведения о компании Acme',
      }),
    )

    const dialog = await screen.findByRole('dialog', { name: 'Acme' })
    expect(dialog).toHaveTextContent('Письмо для Acme')
    expect(screen.queryByLabelText('Имя')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Имя')).toHaveValue('Acme')
  })

  it('ставит отметку о подаче в таблице без открытия карточки', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          schemaVersion: '1.0.0',
          companies: [
            {
              id: 'acme',
              name: 'Acme',
              website: 'https://acme.example',
              email: 'jobs@acme.example',
              coverLetter: '',
              vacancies: [
                {
                  id: 'be-1',
                  title: 'Backend Engineer',
                  url: 'https://acme.example/jobs/be-1',
                  lastAppliedAt: '',
                },
              ],
            },
          ],
        }),
      }),
    )

    render(<App />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: 'Отметка о подаче на Backend Engineer',
        }),
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText('Выберите компанию или добавьте новую.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Отклика не было')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Отметка о подаче на Backend Engineer',
      }),
    )

    await waitFor(() => {
      expect(
        screen.getByText(`Отклик ${todayIsoDate()}`),
      ).toBeInTheDocument()
      expect(
        screen.getByText('Отметка о подаче сохранена в браузере'),
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText('Выберите компанию или добавьте новую.'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Имя')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
