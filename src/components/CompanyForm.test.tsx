import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompanyForm } from '@/components/CompanyForm'
import { todayIsoDate, type Company } from '@/lib/schema'

const acme: Company = {
  id: 'acme',
  name: 'Acme',
  website: 'https://acme.example',
  email: 'jobs@acme.example',
  coverLetter: '',
  vacancies: [
    {
      id: 'fe-1',
      title: 'Frontend Engineer',
      url: 'https://acme.example/jobs/fe-1',
      lastAppliedAt: '',
    },
  ],
}

describe('CompanyForm', () => {
  it('отмечает, меняет и сбрасывает дату отклика по вакансии', () => {
    const handleSave = vi.fn()
    render(<CompanyForm company={acme} onSave={handleSave} />)

    const dateField = screen.getByLabelText(
      'Дата последнего отклика на Frontend Engineer',
    )
    expect(dateField).toHaveValue('')

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Отметить сегодняшний отклик на Frontend Engineer',
      }),
    )
    expect(dateField).toHaveValue(todayIsoDate())

    fireEvent.change(dateField, { target: { value: '2026-09-15' } })
    expect(dateField).toHaveValue('2026-09-15')

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        vacancies: [
          expect.objectContaining({
            id: 'fe-1',
            lastAppliedAt: '2026-09-15',
          }),
        ],
      }),
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Сбросить дату отклика на Frontend Engineer',
      }),
    )
    expect(dateField).toHaveValue('')

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(handleSave).toHaveBeenLastCalledWith(
      expect.objectContaining({
        vacancies: [
          expect.objectContaining({
            id: 'fe-1',
            lastAppliedAt: '',
          }),
        ],
      }),
    )
  })
})
