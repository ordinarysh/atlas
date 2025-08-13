import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '../button'

describe('Button', () => {
  it('renders with default variant tokens', () => {
    const { container } = render(<Button>Click me</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('bg-primary')
    expect(button?.className).toContain('text-primary-contrast')
  })

  it('renders with ghost variant tokens', () => {
    const { container } = render(<Button variant="ghost">Click me</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('hover:bg-muted')
  })

  it('renders with danger variant tokens', () => {
    const { container } = render(<Button variant="danger">Delete</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('bg-danger')
    expect(button?.className).toContain('text-primary-contrast')
  })
})
