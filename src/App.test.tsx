import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '@/App'

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
    })
  })
})
