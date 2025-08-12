import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Card, CardTitle } from './card'

describe('Card', () => {
  it('renders with semantic tokens', () => {
    const { container } = render(<Card>Card content</Card>)
    const card = container.querySelector('div')
    expect(card?.className).toContain('bg-surface')
    expect(card?.className).toContain('border-border')
    expect(card?.className).toContain('rounded-lg')
    expect(card?.className).toContain('shadow-sm')
  })

  it('CardTitle uses semantic tokens', () => {
    const { container } = render(<CardTitle>Title</CardTitle>)
    const title = container.querySelector('h3')
    expect(title?.className).toContain('text-fg')
    expect(title?.className).toContain('text-lg')
    expect(title?.className).toContain('font-semibold')
  })
})