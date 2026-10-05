import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompanyTable } from '@/components/CompanyTable'
import type { Company } from '@/lib/schema'

const acme: Company = {
  id: 'acme',
  name: 'Acme',
  website: 'https://acme.example',
  email: 'jobs@acme.example',
  coverLetter: 'Здравствуйте, команда Acme.',
  vacancies: [
    {
      id: 'fe-1',
      title: 'Frontend Engineer',
      url: 'https://acme.example/jobs/fe-1',
      lastAppliedAt: '2026-10-01',
    },
  ],
}

describe('CompanyTable', () => {
  it('открывает сведения по строке и имени, ссылки и отметка не открывают', () => {
    const handleOpenDetails = vi.fn()
    const handleMarkApplied = vi.fn()
    render(
      <CompanyTable
        companies={[acme]}
        highlightedId={null}
        onOpenDetails={handleOpenDetails}
        onMarkApplied={handleMarkApplied}
      />,
    )

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    const nameButton = screen.getByRole('button', {
      name: 'Открыть сведения о компании Acme',
    })
    fireEvent.click(nameButton)
    expect(handleOpenDetails).toHaveBeenCalledWith('acme')

    handleOpenDetails.mockClear()
    fireEvent.click(screen.getByRole('row', { name: /Acme/ }))
    expect(handleOpenDetails).toHaveBeenCalledWith('acme')

    handleOpenDetails.mockClear()
    fireEvent.click(screen.getByRole('link', { name: 'https://acme.example' }))
    fireEvent.click(screen.getByRole('link', { name: 'jobs@acme.example' }))
    fireEvent.click(screen.getByRole('link', { name: 'Frontend Engineer' }))
    expect(handleOpenDetails).not.toHaveBeenCalled()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Отметка о подаче на Frontend Engineer',
      }),
    )
    expect(handleMarkApplied).toHaveBeenCalledWith('acme', 'fe-1')
    expect(handleOpenDetails).not.toHaveBeenCalled()
    expect(screen.getByText('Отклик 2026-10-01')).toBeInTheDocument()
  })
})
