import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CatalogPager } from '@/components/CatalogPager'

describe('CatalogPager', () => {
  it('показывает номер страницы, число компаний и переключает страницы', () => {
    const handlePageChange = vi.fn()
    render(
      <CatalogPager
        pageCount={3}
        pageIndex={1}
        companyCount={5}
        onPageChange={handlePageChange}
      />,
    )

    expect(screen.getByText('Страница 2 из 3 · 5 компаний')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Предыдущая страница' }))
    expect(handlePageChange).toHaveBeenCalledWith(0)

    fireEvent.click(screen.getByRole('button', { name: 'Страница 3' }))
    expect(handlePageChange).toHaveBeenCalledWith(2)

    fireEvent.click(screen.getByRole('button', { name: 'Следующая страница' }))
    expect(handlePageChange).toHaveBeenCalledWith(2)
  })

  it('блокирует назад на первой и вперёд на последней', () => {
    const handlePageChange = vi.fn()
    const { rerender } = render(
      <CatalogPager
        pageCount={2}
        pageIndex={0}
        companyCount={1}
        onPageChange={handlePageChange}
      />,
    )

    expect(screen.getByRole('button', { name: 'Предыдущая страница' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Следующая страница' }))
    expect(handlePageChange).toHaveBeenCalledWith(1)

    rerender(
      <CatalogPager
        pageCount={2}
        pageIndex={1}
        companyCount={1}
        onPageChange={handlePageChange}
      />,
    )
    expect(screen.getByRole('button', { name: 'Следующая страница' })).toBeDisabled()
  })
})
