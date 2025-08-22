# 🔧 Environment Setup Guide

This guide explains how to configure environment variables for both development and production.

## 📁 Environment Files Structure

```
├── .env.example          # Template with all required variables (SAFE TO COMMIT)
├── .env.production       # Production template (SAFE TO COMMIT)
├── .env.local           # Your local development config (NEVER COMMIT)
├── .env                 # Prisma CLI config (NEVER COMMIT)
```

## 🚀 Quick Setup

### 1. Development Setup

```bash
# Copy the template
cp .env.example .env.local

# Edit .env.local with your actual values
# Never commit this file!
```

### 2. Production Setup

Use the values from `.env.production` and set them in your deployment platform:

- **Vercel**: Project Settings → Environment Variables
- **Railway**: Project Settings → Variables
- **Netlify**: Site Settings → Environment Variables

## 🔑 Required Environment Variables

### Core Services
```bash
# OpenAI API (required for image generation)
OPENAI_API_KEY=sk-proj-your_key_here

# Supabase (required for database and storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database URLs (from Supabase)
DATABASE_URL=postgres://postgres.project:password@pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgres://postgres.project:password@db.supabase.com:5432/postgres

# Authentication secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your_32_character_secret
```

### URLs (Environment-Specific)
```bash
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_URL=http://localhost:3000

# Production (update for your domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
AUTH_URL=https://your-app.vercel.app
```

## 🛠️ Setup Instructions

### For Development

1. **Copy template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Get Supabase credentials:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project → Settings → API
   - Copy URL and anon key
   - Go to Settings → Database → Copy connection string

3. **Get OpenAI API key:**
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create new secret key

4. **Generate auth secret:**
   ```bash
   openssl rand -base64 32
   ```

5. **Fill in .env.local with your values**

### For Production

1. **Copy all variables from .env.production**
2. **Update URLs to match your production domain**
3. **Set in your deployment platform**
4. **Deploy/redeploy your application**

## ⚠️ Security Notes

- **Never commit `.env.local`** - contains sensitive keys
- **Use strong AUTH_SECRET** - minimum 32 characters
- **Different secrets for prod/dev** - don't reuse development secrets
- **Rotate keys regularly** - especially for production

## 🔍 Troubleshooting

### Common Issues

1. **500 errors in production:**
   - Check all environment variables are set
   - Verify database URL is accessible
   - Ensure AUTH_SECRET is set

2. **Auth errors:**
   - Verify AUTH_URL matches your domain
   - Check AUTH_SECRET is properly set
   - Ensure NEXT_PUBLIC_APP_URL is correct

3. **Database connection failed:**
   - Verify DATABASE_URL format
   - Check Supabase project is accessible
   - Ensure connection pooling settings

### Verification

Run these commands to verify your setup:

```bash
# Check development setup
npm run check:production

# Test production deployment
npm run verify:production
```

## 📚 Additional Resources

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Environment Variables Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
