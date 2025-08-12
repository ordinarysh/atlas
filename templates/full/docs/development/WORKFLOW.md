# 🔧 Development Workflow

Your daily development patterns and best practices for productive coding.

## 🏃‍♂️ Daily Development Flow

### **1. Starting Your Day**

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
pnpm install

# Start development server
pnpm dev

# Open your editor
code .
```

### **2. Working on Features**

```bash
# Create feature branch
git checkout -b feature/user-dashboard

# Make your changes...
# ...

# Run quality checks before committing
pnpm check-all

# Commit with conventional format
git commit -m "feat: add user dashboard with analytics"

# Push and create PR
git push -u origin feature/user-dashboard
```

### **3. Before Pushing Code**

```bash
# Always run these before pushing
pnpm type-check    # TypeScript validation
pnpm lint          # Code linting
pnpm format        # Code formatting
pnpm test          # Unit tests
pnpm build         # Build check

# Or run everything at once
pnpm check-all
```

## 🛠️ Development Commands

### **Core Commands**

```bash
# Development
pnpm dev          # Start all apps in dev mode
pnpm dev:web      # Start only web app
pnpm dev:ui       # Start UI package in dev mode

# Building
pnpm build        # Build all packages & apps
pnpm build:web    # Build only web app
pnpm preview      # Preview production build

# Quality Assurance
pnpm check-all    # Run all checks (recommended before commit)
pnpm type-check   # TypeScript validation
pnpm lint         # ESLint checking
pnpm lint:fix     # Auto-fix ESLint issues
pnpm format       # Format code with Prettier
pnpm format:check # Check if formatting is needed
```

### **Testing Commands**

```bash
# Unit Testing (Vitest)
pnpm test         # Run all unit tests
pnpm test:watch   # Run tests in watch mode
pnpm test:ui      # Open Vitest UI interface
pnpm test:coverage # Generate coverage report

# E2E Testing (Playwright)
pnpm test:e2e     # Run E2E tests
pnpm test:e2e:ui  # Run E2E tests with UI
pnpm test:e2e:headed # Run E2E tests in headed mode
```

### **Utility Commands**

```bash
# Clean & Reset
pnpm clean        # Clean build outputs
pnpm reset        # Full reset (node_modules + install)

# Custom Scripts
pnpm fonts:copy   # Copy fonts from UI package to apps
pnpm db:migrate   # Run database migrations
pnpm db:seed      # Seed database with test data
```

## 🎯 Feature Development Process

### **1. Planning Phase**

- [ ] **Create GitHub Issue** - Document the feature request
- [ ] **Define Acceptance Criteria** - What constitutes "done"
- [ ] **Design Review** - UI/UX considerations
- [ ] **Technical Planning** - Architecture decisions

### **2. Implementation Phase**

```bash
# 1. Create feature branch
git checkout main
git pull origin main
git checkout -b feature/social-login

# 2. Set up development environment
pnpm dev

# 3. Write failing test first (TDD approach)
# tests/auth/social-login.test.ts
describe('Social Login', () => {
  it('should redirect to Google OAuth', () => {
    // Test implementation
  })
})

# 4. Implement the feature
# src/components/auth/social-login.tsx
export function SocialLogin() {
  // Component implementation
}

# 5. Make tests pass
pnpm test auth/social-login

# 6. Add integration tests
# tests/e2e/auth.spec.ts
test('user can login with Google', async ({ page }) => {
  // E2E test implementation
})
```

### **3. Quality Assurance**

```bash
# Run full quality check
pnpm check-all

# If anything fails, fix before committing
pnpm lint:fix      # Auto-fix linting issues
pnpm format        # Auto-format code
pnpm test          # Ensure tests pass
```

### **4. Code Review Process**

```bash
# Commit with conventional format
git add .
git commit -m "feat: add Google OAuth social login"

# Push feature branch
git push -u origin feature/social-login

# Create Pull Request on GitHub
# - Clear description of changes
# - Link to related issues
# - Include screenshots for UI changes
# - Add test coverage information
```

## 🧪 Testing Workflow

### **Test-Driven Development (TDD)**

```bash
# 1. Write failing test
pnpm test:watch

# 2. Write minimal code to pass
# Focus on making test green

# 3. Refactor with confidence
# Tests ensure behavior stays correct

# 4. Repeat cycle
```

### **Testing Levels**

1. **Unit Tests** - Individual functions/components
2. **Integration Tests** - Multiple components working together
3. **E2E Tests** - Full user workflows

### **Test Organization**

```
src/
├── components/
│   ├── button.tsx
│   └── button.test.tsx    # Co-located unit tests
tests/
├── integration/           # Integration tests
└── e2e/                  # End-to-end tests
```

## 🔄 Git Workflow

### **Branch Naming Conventions**

```bash
feature/user-authentication    # New features
fix/login-validation-bug      # Bug fixes
docs/api-documentation        # Documentation
refactor/auth-service         # Code refactoring
chore/update-dependencies     # Maintenance
```

### **Commit Message Format**

```bash
# Format: <type>(<scope>): <description>
feat(auth): add Google OAuth integration
fix(ui): resolve button hover state issue
docs(api): update authentication endpoints
refactor(db): optimize user query performance
chore: update dependencies to latest versions

# Types: feat, fix, docs, style, refactor, test, chore
# Scope: auth, ui, api, db, etc. (optional)
```

### **Pull Request Checklist**

- [ ] **Clear title and description**
- [ ] **All tests pass** (`pnpm check-all`)
- [ ] **No merge conflicts** with main branch
- [ ] **Screenshots** for UI changes
- [ ] **Documentation updated** if needed
- [ ] **Breaking changes noted** in description

## 🎨 UI Development Workflow

### **Component Development**

```tsx
// 4. Use in apps
import { Button } from "@repo/ui";

// 1. Start with props interface
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

// 2. Implement component with Tailwind
export function Button({ variant = "primary", size = "md", children }: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-lg font-medium transition-colors",
        variant === "primary" && "bg-primary hover:bg-primary/90 text-white",
        size === "md" && "px-4 py-2",
      )}
    >
      {children}
    </button>
  );
}

// 3. Add to package exports
// packages/ui/src/index.ts
export { Button } from "./components/button";
```

### **Styling Workflow**

```css
/* 1. Define tokens in packages/ui/src/theme.css */
--color-primary: oklch(0.545 0.218 264.5);

/* 2. Use in Tailwind classes */
<button className="bg-primary text-white">

/* 3. For complex styles, use @layer components */
@layer components {
  .btn-primary {
    @apply bg-primary hover:bg-primary/90 text-white;
  }
}
```

## 🐛 Debugging Workflow

### **Development Tools**

```bash
# React Developer Tools
# Install browser extension for component inspection

# Next.js DevTools
# Built into Next.js dev server

# Tailwind CSS IntelliSense
# VSCode extension for class autocompletion

# TypeScript Error Lens
# Shows TypeScript errors inline
```

### **Common Issues**

```bash
# Port already in use
lsof -ti:3000 | xargs kill -9

# Package not found
pnpm install

# TypeScript errors
pnpm type-check

# Build failures
pnpm clean && pnpm install && pnpm build

# Test failures
pnpm test -- --reporter verbose
```

### **Debugging Production Issues**

```bash
# 1. Check Sentry for errors
# Visit your Sentry dashboard

# 2. Review application logs
# Check deployment platform logs

# 3. Reproduce locally
pnpm build && pnpm preview

# 4. Add debug logging
console.log('Debug:', { variable, state })

# 5. Use browser dev tools
# Network, Console, Performance tabs
```

## 📊 Performance Workflow

### **Development Performance**

```bash
# Check bundle size
pnpm build
pnpm bundle-analyzer

# Measure build times
time pnpm build

# Profile React components
# Use React DevTools Profiler
```

### **Runtime Performance**

```tsx
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
});

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return expensiveCalculation(rawData);
}, [rawData]);

// Use useCallback for stable function references
const handleClick = useCallback(
  (id: string) => {
    onItemClick(id);
  },
  [onItemClick],
);
```

## 🔧 IDE Setup

### **VSCode Extensions**

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "ms-playwright.playwright"
  ]
}
```

### **VSCode Settings**

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.preferTypeOnlyAutoImports": true,
  "tailwindCSS.experimental.classRegex": [["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]]
}
```

## 📚 Related Guides

- [🚀 Getting Started](../setup/GETTING_STARTED.md) - Initial setup
- [🏗️ Project Structure](../setup/PROJECT_STRUCTURE.md) - Understanding the codebase
- [🧪 Testing Strategy](../testing/STRATEGY.md) - Testing approach
- [🔄 Git Conventions](./GIT.md) - Git best practices
- [🎨 Component Development](../frontend/COMPONENTS.md) - UI patterns

---

**Consistent workflow leads to consistent results.** Follow these patterns and your team will build
features faster with fewer bugs! 🚀
