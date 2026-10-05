import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompanyDetailsModal } from '@/components/CompanyDetailsModal'
import type { Company } from '@/lib/schema'

const acme: Company = {
  id: 'acme',
  name: 'Acme',
  website: 'https://acme.example',
  email: 'jobs@acme.example',
  coverLetter: 'Здравствуйте, команда Acme.\nПолный текст письма.',
  vacancies: [
    {
      id: 'fe-1',
      title: 'Frontend Engineer',
      url: 'https://acme.example/jobs/fe-1',
      lastAppliedAt: '2026-10-01',
    },
  ],
}

describe('CompanyDetailsModal', () => {
  it('показывает сведения, закрывается по Escape и отдаёт редактирование', () => {
    const handleClose = vi.fn()
    const handleEdit = vi.fn()
    render(
      <CompanyDetailsModal
        company={acme}
        onClose={handleClose}
        onEdit={handleEdit}
      />,
    )

    const dialog = screen.getByRole('dialog', { name: 'Acme' })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveTextContent('Здравствуйте, команда Acme.')
    expect(dialog).toHaveTextContent('Полный текст письма.')
    expect(screen.getByRole('link', { name: 'https://acme.example' })).toHaveAttribute(
      'href',
      'https://acme.example',
    )
    expect(screen.getByRole('link', { name: 'jobs@acme.example' })).toHaveAttribute(
      'href',
      'mailto:jobs@acme.example',
    )
    expect(screen.getByRole('link', { name: 'Frontend Engineer' })).toHaveAttribute(
      'href',
      'https://acme.example/jobs/fe-1',
    )
    expect(screen.getByText('Отклик 2026-10-01')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }))
    expect(handleEdit).toHaveBeenCalled()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalled()
  })
})
