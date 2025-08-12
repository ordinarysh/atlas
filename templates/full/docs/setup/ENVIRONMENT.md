# 🌍 Environment Variables

Configure your environment variables securely across all environments.

## 📋 Environment Files

```
.env.local          # Local development (never commit)
.env.example        # Template with example values (commit this)
.env.production     # Production values (secure deployment)
.env.test           # Test environment values
```

## 🔧 Setup Process

### **1. Create Local Environment**

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your actual values
nano .env.local
```

### **2. Required Variables**

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/myapp"

# Authentication (BetterAuth)
AUTH_SECRET="your-random-secret-key-here"
AUTH_TRUST_HOST="true"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Redis (Upstash)
REDIS_URL="redis://your-redis-url"
REDIS_TOKEN="your-redis-token"

# Monitoring (Sentry)
SENTRY_DSN="your-sentry-dsn"
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="your-sentry-project"

# Email (Optional)
EMAIL_FROM="noreply@yourapp.com"
SMTP_HOST="smtp.yourprovider.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
```

### **3. Environment-Specific Settings**

```bash
# Development
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Production
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourapp.com"
```

## 🔒 Security Best Practices

- ❌ **Never commit `.env.local`** or real secrets
- ✅ **Use strong, random secrets** for AUTH_SECRET
- ✅ **Rotate secrets regularly** in production
- ✅ **Use different values** for each environment
- ✅ **Store production secrets** in secure deployment platform

## 📚 Related Guides

- [🔒 BetterAuth Setup](../auth/BETTER_AUTH.md) - Authentication configuration
- [📊 Redis Setup](../data/REDIS.md) - Caching configuration
- [🚀 Deployment](../devops/DEPLOYMENT.md) - Production environment setup

---

**Environment security is critical for production apps!** 🔐
