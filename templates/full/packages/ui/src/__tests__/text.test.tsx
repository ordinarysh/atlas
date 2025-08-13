import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Text } from '../text'

describe('Text', () => {
  it('renders with base size by default', () => {
    const { container } = render(<Text>Hello world</Text>)
    const element = container.querySelector('p')
    expect(element?.className).toContain('text-base')
    expect(element?.className).toContain('text-fg')
  })

  it('renders with xs size', () => {
    const { container } = render(<Text size="xs">Small text</Text>)
    const element = container.querySelector('p')
    expect(element?.className).toContain('text-xs')
  })

  it('renders with lg size', () => {
    const { container } = render(<Text size="lg">Large text</Text>)
    const element = container.querySelector('p')
    expect(element?.className).toContain('text-lg')
  })
})
