# Calendar MVP

A modern calendar app with horizontal multi-day view, zoom controls, and Google Calendar integration for two accounts (work + private).

## Features

- **Horizontal multi-day view** - Scroll left/right through days
- **Zoom** - From detailed hourly view to 30+ day overview
- **Dual account support** - Connect both work and private Google accounts
- **Read-only** - View your events without risk of modification
- **Virtualized rendering** - Smooth performance with many events

## Tech Stack

- React + TypeScript
- Vite
- `@react-oauth/google` for OAuth
- `react-window` for virtualization
- `date-fns` for date handling

## Quick Start

```bash
# Install dependencies
npm install

# Create .env file with your Google Client ID
echo "VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com" > .env

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Setup

See [SETUP.md](./SETUP.md) for detailed Google Cloud setup instructions.

## Project Structure

```
src/
├── components/
│   ├── CalendarGrid.tsx   # Main horizontal scrolling grid
│   ├── DayColumn.tsx      # Single day column with events
│   ├── EventCard.tsx      # Individual event display
│   ├── ZoomControls.tsx   # Zoom slider and presets
│   └── AccountConnect.tsx # Google account connection buttons
├── hooks/
│   ├── useGoogleAuth.ts   # OAuth logic, dual account support
│   └── useCalendarEvents.ts # Fetch and merge events from both accounts
├── types/
│   └── index.ts           # TypeScript types
├── utils/
│   └── dateUtils.ts       # Date formatting and calculations
├── App.tsx                # Main app component
└── main.tsx               # Entry point
```

## Usage

1. Click "Connect Work" or "Connect Private" to add a Google account
2. Select your Google account and grant calendar read permission
3. Events from connected accounts appear in the calendar
4. Use zoom controls or scroll to navigate

## Color Coding

- **Blue** - Work account events
- **Purple highlight** - Today's column

## License

MIT
