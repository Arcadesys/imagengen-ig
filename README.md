# AI Image Generator - Accessibility First App

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/austen-tuckers-projects/v0-accessibility-first-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/YMpcFCrQNki)

## Overview

An accessibility-focused AI image generation application built with Next.js, TypeScript, and React. Uses Prisma with PostgreSQL (Vercel Postgres recommended) and NextAuth credentials auth by default.

### Features

- 🎨 AI-powered image generation using OpenAI
- 🔐 Credentials (email/password) auth via NextAuth + Prisma
- 🖼️ Image gallery with alt text management
- 📱 Responsive design

## Setup

### 1) Environment variables

Copy `.env.example` to `.env.local` and set:

- DATABASE_URL (Postgres connection string)
- DIRECT_URL (optional, writer connection)
- AUTH_SECRET (openssl rand -base64 32)
- AUTH_URL (http://localhost:3000 in dev)
- ADMIN_SECRET (for admin APIs)

### 2) Database

- Create a Postgres database (local, Neon, or Vercel Postgres)
- Push schema:
  - npm run prisma:push (or `npx prisma migrate dev`)

### 3) Seed an admin user

Create a user with a password:

- POST /api/admin/seed-user { email, password, name? } (see below)

### Deploy on Vercel

- Set DATABASE_URL, DIRECT_URL (if used), AUTH_SECRET, AUTH_URL, ADMIN_SECRET in Vercel Project Settings
- Deploy. No additional build steps beyond Next.js

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run test suite

### Testing OpenAI Integration

You can verify OpenAI integration by running the test suite which includes API checks.

## Accessibility Features

This application prioritizes accessibility:

- **Screen Reader Support**: All images include proper alt text
- **Keyboard Navigation**: Full keyboard accessibility
- **Live Regions**: Dynamic content announcements
- **ARIA Labels**: Comprehensive labeling for complex UI elements
- **Color Contrast**: WCAG AA compliant color schemes

## Recent Fixes Applied

This repository has been updated to resolve several critical issues:

1. **Build Failures**: Fixed OpenAI client initialization that caused build-time errors
2. **Dependency Conflicts**: Resolved React 19 compatibility issues
3. **Code Quality**: Fixed ESLint errors and improved code standards
4. **Documentation**: Added comprehensive setup instructions and environment variable documentation

## Deployment

Your project is live at:

**[https://vercel.com/austen-tuckers-projects/v0-accessibility-first-app](https://vercel.com/austen-tuckers-projects/v0-accessibility-first-app)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/YMpcFCrQNki](https://v0.app/chat/projects/YMpcFCrQNki)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Image generation: policies and endpoints

- Default size policy: Non-admin requests are forced to 512x512, regardless of requested size. “4k” is treated as a realism hint, not a resolution. Admins can request larger sizes.
- Admin access: Include header `x-admin-secret: <ADMIN_SECRET>` on the request. Set `ADMIN_SECRET` in your environment.

### New preset: Cartoons in Live Action

In the Turn Toon builder, the preset “Cartoons in Live Action” inserts 2D/2.5D characters into real live-action plates without altering the environment, with scene-matched lighting, flat/cel shading, and realistic shadows/DOF. Use it from the preset dropdown on the Turn Toon page.

### /api/puppetray

Endpoint that always converts the subject into a puppet while preserving the real scene. Supports masking for targeted edits.

- Route: `POST /api/puppetray`
- Body:
  - `prompt?`: string — extra subject detail; optional.
  - `puppetStyle`: "sock" | "muppet" | "mascot" | "felt" | "paper" | "plush" (required)
  - `size?`: "512x512" | "768x768" | "1024x1024" (non-admins will be forced to 512x512)
  - `n?`: number — number of variations (default 1)
  - `seed?`: string | number | null — optional seed
  - `baseImageId?`: string | null — ID of a previously uploaded base image (from /api/images/upload)
  - `maskData?`: string | null — data URL (PNG) mask; edits are applied inside the mask only

Returns the same shape as `/api/images/generate`.

Notes:

- The real environment (background, plate) is preserved; only the subject becomes a puppet matching the chosen style/materials.
- Safety filters apply to the composed prompt before generation.
