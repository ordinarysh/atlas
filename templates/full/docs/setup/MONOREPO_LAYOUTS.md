# 🏗️ Monorepo Layout Patterns: The 3 Best Approaches

## Overview

When organizing a monorepo, choosing the right folder structure is crucial for maintainability,
scalability, and team productivity. This guide explains the **3 proven layout patterns** used in
enterprise applications, with examples you can implement in your `apps/` folder.

> **📍 Current Status:** This boilerplate will include all 3 patterns as working examples in
> separate apps

---

## 🎯 The 3 Layout Patterns

### 1. **Scope-Based Layout** ⭐ **(Recommended for Enterprise)**

**What it is:** Groups projects by business domains or product areas, with shared libraries
organized by scope.

**Structure:**

```
apps/
  booking-admin/          # Admin app for booking domain
  booking-customer/       # Customer app for booking domain
  analytics-dashboard/    # Analytics domain app

packages/
  booking/
    feature-shell/        # Booking core features
    data-access/          # Booking API calls
    ui-components/        # Booking-specific UI
  analytics/
    feature-charts/       # Analytics features
    data-access/          # Analytics API calls
  shared/
    ui-core/             # Cross-domain UI components
    utils/               # Common utilities
    types/               # Shared TypeScript types
```

**✅ Pros:**

- **Best for large teams** - Clear ownership boundaries
- **Scales excellently** - Each domain team owns their scope
- **Reduces conflicts** - Teams rarely touch each other's code
- **Enterprise standard** - Used by Google, Microsoft, Meta

**❌ Cons:**

- **Initial complexity** - Requires planning domain boundaries
- **Learning curve** - New developers need to understand domain structure

**👥 Perfect for:**

- Teams with 10+ developers
- Multiple product areas
- Clear business domains
- Long-term projects

---

### 2. **Feature-Based Layout** 🚀 **(Great for Product Teams)**

**What it is:** Organizes code around business capabilities and user features rather than technical
layers.

**Structure:**

```
apps/
  web-app/
  mobile-app/

packages/
  features/
    user-authentication/
      components/         # Auth UI components
      hooks/             # Auth business logic
      services/          # Auth API calls
      types/             # Auth types

    payment-processing/
      components/         # Payment UI
      hooks/             # Payment logic
      services/          # Payment APIs
      types/             # Payment types

    product-catalog/
      components/
      hooks/
      services/
      types/

  shared/
    ui-primitives/       # Basic UI components
    utils/              # Common utilities
    config/             # App configuration
```

**✅ Pros:**

- **High code reuse** - 90%+ code sharing across platforms
- **Clear feature boundaries** - Easy to find feature-related code
- **Great for full-stack** - Frontend and backend logic together
- **Team friendly** - Features can be owned by small teams

**❌ Cons:**

- **Can become bloated** - Large features need sub-organization
- **Cross-feature dependencies** - Features might depend on each other

**👥 Perfect for:**

- Product-focused teams (5-15 developers)
- Multi-platform applications (web + mobile)
- Rapid feature development
- Startups to mid-size companies

---

### 3. **Page-Based Layout** 📄 **(Simple but Limited)**

**What it is:** Mirrors your application's routing structure and page hierarchy.

**Structure:**

```
apps/
  marketing-site/
  dashboard-app/

packages/
  pages/
    home/
      components/         # Home page components
      hooks/             # Home page logic
      styles/            # Home page styles

    dashboard/
      components/         # Dashboard components
      hooks/             # Dashboard logic
      charts/            # Dashboard-specific charts

    profile/
      components/
      hooks/
      forms/

    settings/
      components/
      hooks/
      modals/

  shared/
    components/           # Reusable UI components
    hooks/               # Common hooks
    utils/               # Utility functions
    styles/              # Global styles
```

**✅ Pros:**

- **Intuitive structure** - Matches your app's navigation
- **Easy to start** - Beginners understand it immediately
- **Simple navigation** - Find page code by following URL structure
- **Good for content sites** - Perfect for marketing sites, blogs

**❌ Cons:**

- **Code duplication** - Similar functionality repeated across pages
- **Hard to share logic** - Business rules scattered across pages
- **Doesn't scale** - Becomes unwieldy with many pages
- **Tight coupling** - Changes often require touching multiple pages

**👥 Perfect for:**

- Small teams (1-5 developers)
- Simple applications
- Content-heavy sites
- Rapid prototypes

---

## 🤔 Which Pattern Should You Choose?

### Decision Framework:

| Factor               | Scope-Based            | Feature-Based   | Page-Based     |
| -------------------- | ---------------------- | --------------- | -------------- |
| **Team Size**        | 10+ developers         | 5-15 developers | 1-5 developers |
| **App Complexity**   | Enterprise             | Medium-High     | Simple-Medium  |
| **Business Domains** | Multiple clear domains | Single product  | Simple flow    |
| **Long-term Scale**  | Excellent              | Good            | Limited        |
| **Learning Curve**   | Steep                  | Medium          | Easy           |

### Quick Decision Guide:

**Choose Scope-Based if:**

- Building an enterprise platform
- Have multiple business domains (e.g., booking + analytics + payments)
- Large development team
- Plan to scale significantly

**Choose Feature-Based if:**

- Building a product with clear features
- Have web + mobile apps
- Want maximum code reuse
- Team understands the business domain well

**Choose Page-Based if:**

- Building a simple application
- Small team or solo developer
- Need to move quickly
- Application is mostly content/marketing focused

---

## 🛠️ Implementation in This Boilerplate

This boilerplate includes **working examples** of all 3 patterns:

```
apps/
  scope-based-example/     # Enterprise-style app
  feature-based-example/   # Product-focused app
  page-based-example/      # Simple content app
```

Each example demonstrates:

- ✅ **Folder structure** - How to organize your code
- ✅ **Component patterns** - Where to put different types of components
- ✅ **Shared packages** - How to structure reusable code
- ✅ **Import patterns** - How packages import from each other
- ✅ **Build configuration** - Turborepo setup for each pattern

---

## 📚 Next Steps

1. **[Explore Examples](../guides/PATTERNS.md)** - See code examples for each pattern
2. **[Project Structure](./PROJECT_STRUCTURE.md)** - Understand the overall monorepo
3. **[Development Workflow](../development/WORKFLOW.md)** - Learn daily development practices

---

## 🎯 Key Takeaways

- **Scope-Based** = Best for enterprise scale and clear business domains
- **Feature-Based** = Perfect for product teams with multiple platforms
- **Page-Based** = Great for simple apps and small teams
- **Start simple** and evolve - You can migrate between patterns as you grow
- **This boilerplate** shows you all 3 in action - pick what fits your needs

> **💡 Pro Tip:** Most successful companies start with Feature-Based and evolve to Scope-Based as
> they scale. Page-Based works great for marketing sites and simple tools.
