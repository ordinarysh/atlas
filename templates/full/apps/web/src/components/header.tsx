import { ThemeToggle } from './theme-toggle'

export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-fg">Atlas Template</h1>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}