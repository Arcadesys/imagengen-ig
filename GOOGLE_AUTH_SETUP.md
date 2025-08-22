# Google Authentication Setup

This guide will help you set up Google OAuth for your AI Image Generator application.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "AI Image Generator")
5. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, make sure your project is selected
2. Go to "APIs & Services" > "Library"
3. Search for "Google+ API"
4. Click on it and click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace account)
3. Fill in the required fields:
   - App name: "AI Image Generator"
   - User support email: Your email
   - Developer contact information: Your email
4. Click "Save and Continue"
5. For scopes, click "Save and Continue" (we'll use default scopes)
6. For test users, add your email address if you're in testing mode
7. Click "Save and Continue"

## Step 4: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Name it "AI Image Generator Web Client"
5. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
6. Click "Create"
7. Copy the Client ID and Client Secret

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your Google credentials:
   ```bash
   GOOGLE_CLIENT_ID=your-google-client-id-from-step-4
   GOOGLE_CLIENT_SECRET=your-google-client-secret-from-step-4
   NEXTAUTH_SECRET=your-random-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   ```

3. Generate a random secret for `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

## Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. Click "Sign In" - you should be redirected to Google's OAuth page
4. Grant permissions and you should be redirected back to your app

## Production Deployment

When deploying to production:

1. Update the redirect URI in Google Cloud Console to match your production domain
2. Update the `NEXTAUTH_URL` environment variable to your production URL
3. Make sure all environment variables are set in your production environment

## Troubleshooting

### Common Issues

1. **Redirect URI mismatch**: Make sure the redirect URI in Google Cloud Console exactly matches the one being used
2. **Invalid client**: Double-check your Client ID and Client Secret
3. **Access blocked**: Your app might be in testing mode - either add test users or publish the app

### Error Messages

- "Error 400: redirect_uri_mismatch": Check your redirect URIs in Google Cloud Console
- "Access blocked": Your app is in testing mode and the user isn't added as a test user

## Security Notes

1. Never commit your `.env` file to version control
2. Use different OAuth credentials for development and production
3. Regularly rotate your `NEXTAUTH_SECRET`
4. Review and limit the OAuth scopes if needed
