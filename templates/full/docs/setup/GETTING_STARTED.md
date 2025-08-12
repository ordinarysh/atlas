# 🚀 Getting Started

Welcome to your modern monorepo boilerplate! This guide will get you up and running in minutes.

## ⚡ Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm 8+** - [Install](https://pnpm.io/installation)
- **Git** - For version control

## 🏃‍♂️ Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url> my-awesome-app
cd my-awesome-app

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev

# 4. Open in browser
open http://localhost:3000
```

🎉 **You're ready to go!** The development server is running and you'll see your app at
`http://localhost:3000`.

## 🏗️ What You Get

This boilerplate includes everything you need for modern web development:

### **Frontend Stack**

- ⚡ **Next.js 15** - React framework with App Router
- 🎨 **Tailwind CSS v4** - Utility-first styling
- 🎭 **Framer Motion** - Smooth animations
- 📝 **TypeScript** - Type safety throughout

### **Authentication & Security**

- 🔐 **BetterAuth** - Complete auth solution
- 🔑 **OAuth Integration** - Social logins ready
- 🛡️ **MFA Support** - Multi-factor authentication
- 🔒 **Security Best Practices** - Built-in protection

### **Data Management**

- 🔄 **React Query** - Server state management
- ✅ **Zod** - Schema validation
- ⚡ **Upstash Redis** - Caching and real-time data
- 🏪 **State Patterns** - Predictable state flow

### **Development Tools**

- 🧪 **Vitest** - Fast unit testing
- 🎯 **Playwright** - E2E testing
- 🔍 **ESLint + Prettier** - Code quality
- 🪝 **Husky + Commitlint** - Git hooks
- 📊 **Sentry** - Error monitoring

### **Infrastructure**

- 🏗️ **Turborepo** - Monorepo orchestration
- 📦 **pnpm Workspaces** - Efficient package management
- 🚀 **GitHub Actions** - CI/CD ready
- ☁️ **Deployment Ready** - Vercel, Railway, Docker

## 🎯 First Steps Checklist

Complete these steps to make the project yours:

### **1. Customize Branding**

- [ ] Update colors in `packages/ui/src/theme.css`
- [ ] Add your fonts (see [Font Setup](./FONT_SETUP.md))
- [ ] Update app metadata in `apps/web/src/app/layout.tsx`

### **2. Configure Environment**

- [ ] Copy `.env.example` to `.env.local`
- [ ] Set up database connection
- [ ] Configure authentication providers
- [ ] Add monitoring services

### **3. Set Up Services**

- [ ] Create Upstash Redis database
- [ ] Configure BetterAuth providers
- [ ] Set up Sentry project
- [ ] Configure deployment platform

### **4. Development Workflow**

- [ ] Read [Development Workflow](../development/WORKFLOW.md)
- [ ] Understand [Testing Strategy](../testing/STRATEGY.md)
- [ ] Review [Git Conventions](../development/GIT.md)

## 🛠️ Available Commands

```bash
# Development
pnpm dev          # Start all apps in development mode
pnpm dev:web      # Start only web app
pnpm build        # Build all packages and apps
pnpm preview      # Preview production build locally

# Code Quality
pnpm type-check   # Run TypeScript checks
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
pnpm check-all    # Run all quality checks

# Testing
pnpm test         # Run unit tests with Vitest
pnpm test:e2e     # Run E2E tests with Playwright
pnpm test:ui      # Open Vitest UI
pnpm test:coverage # Generate test coverage report

# Utilities
pnpm clean        # Clean all build outputs
pnpm reset        # Reset node_modules and reinstall
pnpm fonts:copy   # Copy custom fonts to apps
```

## 🏗️ Project Structure

```
my-awesome-app/
├── apps/
│   └── web/              # Next.js application
│       ├── src/app/      # App Router pages
│       ├── src/components/   # App-specific components
│       └── public/       # Static assets
├── packages/
│   ├── ui/              # Shared design system
│   │   ├── src/theme.css    # Design tokens
│   │   └── src/components/  # Reusable components
│   ├── eslint-config/   # Shared ESLint config
│   └── typescript-config/ # Shared TypeScript config
├── docs/                # Documentation (you're here!)
├── scripts/             # Automation scripts
└── tests/              # E2E tests
```

## 📚 Next Steps

Now that you're set up, explore these guides based on what you want to build:

### **Building Features**

- [🎨 Styling Components](../frontend/TAILWIND.md) - Learn the design system
- [🔒 Adding Authentication](../auth/BETTER_AUTH.md) - User management
- [📊 Fetching Data](../data/REACT_QUERY.md) - Server state management
- [🎭 Adding Animations](../frontend/MOTION.md) - Smooth interactions

### **Development Workflow**

- [🔧 Daily Development](../development/WORKFLOW.md) - Day-to-day patterns
- [🧪 Writing Tests](../testing/STRATEGY.md) - Testing approach
- [🚀 Deploying](../devops/DEPLOYMENT.md) - Going to production

### **Advanced Topics**

- [⚡ Performance](../devops/PERFORMANCE.md) - Optimization strategies
- [🔍 Monitoring](../devops/SENTRY.md) - Error tracking
- [📖 Patterns](../guides/PATTERNS.md) - Common solutions

## 🆘 Need Help?

- 📖 **Documentation**: Browse the `/docs` folder for detailed guides
- 🐛 **Issues**: Check [Troubleshooting](../guides/TROUBLESHOOTING.md)
- 💬 **Community**: Create an issue on GitHub
- 📧 **Support**: Check the main README for contact info

---

**Ready to build something amazing?** Start with the
[Development Workflow](../development/WORKFLOW.md) to understand daily development patterns! 🚀
