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
    },
  ],
}

describe('CompanyTable', () => {
  it('показывает колонки и кликабельные ячейки, письмо в подсказке', () => {
    const handleSelect = vi.fn()
    render(
      <CompanyTable
        companies={[acme]}
        selectedId={null}
        onSelect={handleSelect}
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'Имя' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Сайт' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Вакансии' }),
    ).toBeInTheDocument()

    const nameButton = screen.getByRole('button', {
      name: 'Открыть карточку компании Acme',
    })
    expect(nameButton).toHaveAttribute(
      'title',
      'Здравствуйте, команда Acme.',
    )
    expect(nameButton).toHaveAttribute('aria-describedby', 'company-letter-acme')
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Здравствуйте, команда Acme.',
    )

    fireEvent.click(nameButton)
    expect(handleSelect).toHaveBeenCalledWith('acme')

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
  })
})
