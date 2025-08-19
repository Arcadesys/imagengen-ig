# AI Image Generator - Accessibility First App

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/austen-tuckers-projects/v0-accessibility-first-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/YMpcFCrQNki)

## Overview

An accessibility-focused AI image generation application built with Next.js, TypeScript, and React. This app integrates with OpenAI's DALL-E API to generate images while maintaining strong accessibility standards.

### Features

- 🎨 AI-powered image generation using OpenAI DALL-E
- ♿ Accessibility-first design with screen reader support
- 🖼️ Image gallery with alt text management
- 📱 Responsive design for all devices
- 🎭 Image editing with mask painting capabilities
- 📊 OpenAI API configuration testing

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- OpenAI API key (get one at [platform.openai.com](https://platform.openai.com/api-keys))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Arcadesys/imagengen-ig.git
cd imagengen-ig
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local and add your OpenAI API key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key (starts with `sk-`) | Yes |
| `NEXT_PUBLIC_APP_URL` | Your app URL (for production) | No |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run test suite

### Testing OpenAI Integration

Visit `/test-openai` to verify your OpenAI API configuration. This page will test:
- API key presence and format
- OpenAI client initialization
- API connectivity
- DALL-E model availability

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
