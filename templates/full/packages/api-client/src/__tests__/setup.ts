import { vi } from 'vitest'

// Mock fetchJson from @atlas/query
vi.mock('@atlas/query', () => ({
  fetchJson: vi.fn(),
}))
