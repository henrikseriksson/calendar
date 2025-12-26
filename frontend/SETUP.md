# Google Cloud Setup Guide

This guide walks you through setting up Google OAuth for the Calendar app.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com)

## Step 1: Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Calendar App")
5. Click "Create"
6. Wait for the project to be created, then select it

## Step 2: Enable Google Calendar API

1. In the left sidebar, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on "Google Calendar API"
4. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" (unless you have a Google Workspace organization)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: Calendar App
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click "Save and Continue"
6. On "Scopes" page, click "Add or Remove Scopes"
7. Search for and add: `https://www.googleapis.com/auth/calendar.readonly`
8. Click "Update", then "Save and Continue"
9. On "Test users" page, click "Add Users"
10. Add your email address (and any other test users)
11. Click "Save and Continue"

## Step 4: Create OAuth Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Enter a name (e.g., "Calendar Web Client")
5. Under "Authorized JavaScript origins", add:
   - `http://localhost:5173`
6. Under "Authorized redirect URIs", add:
   - `http://localhost:5173`
7. Click "Create"
8. Copy your **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)

## Step 5: Configure the App

1. In the `frontend` directory, create a `.env` file:

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

2. Restart the dev server if it's running:

```bash
npm run dev
```

## Troubleshooting

### "Access blocked: This app's request is invalid"

- Make sure `http://localhost:5173` is added to both JavaScript origins AND redirect URIs
- Check that you're using the correct Client ID

### "Error 403: access_denied"

- Make sure your email is added as a test user in the OAuth consent screen
- The app is in "Testing" mode and only allows configured test users

### Token expires quickly

- This is normal for the frontend-only approach
- Tokens expire after 1 hour; just reconnect when prompted
- Consider implementing the backend approach for longer sessions

### Can't see all calendars

- Currently only the primary calendar is fetched
- To see other calendars, extend the `useCalendarEvents` hook to call `calendarList.list`

## Production Deployment

When deploying to production:

1. Add your production domain to authorized origins and redirect URIs
2. Consider publishing the app (requires Google verification for sensitive scopes)
3. For better security, implement the backend token vault approach

## Security Notes

- Tokens are stored in `sessionStorage` (cleared when browser closes)
- Only read-only calendar scope is requested
- The app cannot modify your calendar events
- For shared computers, consider using incognito mode

