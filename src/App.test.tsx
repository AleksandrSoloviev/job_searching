import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '@/App'

describe('App', () => {
  it('показывает оболочку трекера', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Трекер целевых компаний' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Каркас приложения готов/i),
    ).toBeInTheDocument()
  })
})
