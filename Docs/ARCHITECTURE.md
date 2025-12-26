# Architecture Documentation

## Overview

The Calendar MVP is a frontend-only React application that connects to Google Calendar API directly from the browser using OAuth 2.0.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser                                   │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │  App.tsx     │────▶│ useGoogleAuth│────▶│ Google OAuth │     │
│  │              │     │              │     │ (popup)      │     │
│  └──────┬───────┘     └──────────────┘     └──────────────┘     │
│         │                    │                                   │
│         │                    ▼                                   │
│         │             ┌──────────────┐                          │
│         │             │sessionStorage│  (tokens per account)    │
│         │             └──────────────┘                          │
│         │                    │                                   │
│         ▼                    ▼                                   │
│  ┌──────────────┐     ┌──────────────┐                          │
│  │CalendarGrid  │◀────│useCalendar   │                          │
│  │              │     │Events        │──────▶ Google Calendar   │
│  └──────┬───────┘     └──────────────┘        API               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ DayColumn    │  × N days (virtualized)                       │
│  │  └─EventCard │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### Authentication (`useGoogleAuth`)

Handles OAuth 2.0 flow for two separate Google accounts:

1. User clicks "Connect Work" or "Connect Private"
2. `@react-oauth/google` opens Google's OAuth popup
3. User selects account and grants `calendar.readonly` permission
4. Access token is stored in `sessionStorage` with expiry timestamp
5. Tokens are keyed by account ID (`work` or `private`)

**Token Storage Structure:**
```typescript
{
  work: { accessToken: "ya29...", expiresAt: 1703520000000 },
  private: { accessToken: "ya29...", expiresAt: 1703520000000 }
}
```

### Event Fetching (`useCalendarEvents`)

Fetches and merges events from both connected accounts:

1. On mount or token change, fetch events from each connected account
2. Use Google Calendar API `events.list` endpoint
3. Handle pagination with `nextPageToken`
4. Normalize events (all-day vs timed)
5. Merge both accounts' events
6. Sort by start timestamp

**Normalization:**
- All-day events: `start.date` → midnight timestamp
- Timed events: `start.dateTime` → exact timestamp

### Calendar Grid (`CalendarGrid`)

Virtualized horizontal scrolling container with month and week indicators:

- Uses custom virtualization with visible range tracking
- Renders 120 days (60 before + 60 after today)
- Only renders visible columns + buffer for performance
- Scrolls to today on mount
- **Month indicator bar**: Thin colored bar at top showing current month
- **Week indicator bar**: Shows week number (e.g., "w. 32") below month bar

### Day Column (`DayColumn`)

Renders a single day with its events:

**Zoomed In (pxPerDay >= 80):**
- Time grid showing hours 07:00-22:00 (configurable range)
- Events positioned absolutely by time
- Event height based on duration

**Zoomed Out (pxPerDay < 80):**
- Compact chip view
- Max 5 events shown
- "+N more" indicator

**Weekend Styling:**
- Saturday and Sunday columns have a distinct warm background tint
- Weekend label text uses amber color

### Zoom System

Controlled by `pxPerDay` state (pixels per day column):

| Level | pxPerDay | View |
|-------|----------|------|
| Month | 30px | Compact chips, ~30 days visible |
| Week | 100px | Medium detail, ~8 days visible |
| Day | 200px | Full hourly grid (07-22), ~4 days visible |

## Event Data Model

```typescript
type CalEvent = {
  id: string;           // Unique: "accountId-googleEventId"
  accountId: AccountId; // "work" | "private"
  title: string;
  allDay: boolean;
  start: string;        // Original Google format
  end: string;
  startTs: number;      // Normalized timestamp (ms)
  endTs: number;
  color: string;        // Account color for visual distinction
};
```

## File Structure

```
frontend/src/
├── components/
│   ├── CalendarGrid.tsx   # Virtualized horizontal scroll + month/week bars
│   ├── DayColumn.tsx      # Single day, handles zoom modes + weekend styling
│   ├── EventCard.tsx      # Event display (compact or full)
│   ├── ZoomControls.tsx   # Zoom slider and presets
│   └── AccountConnect.tsx # Account connection UI
├── hooks/
│   ├── useGoogleAuth.ts   # OAuth flow, token management
│   └── useCalendarEvents.ts # API calls, event normalization
├── types/
│   └── index.ts           # Shared TypeScript types
├── utils/
│   └── dateUtils.ts       # Date formatting, positioning math, week numbers
├── App.tsx                # Root component, providers
├── App.css                # All styling
├── index.css              # Base styles, scrollbar
└── main.tsx               # React entry point
```

## Styling Approach

### Light Theme
- **Background**: Off-white/cream tones (#faf9f7, #f5f3f0)
- **Text**: Dark grays (#2d2d2d, #4a4a4a)
- **Borders**: Subtle warm gray (#e5e2dd)
- **Accents**: Indigo/purple (#6366f1, #8b5cf6)

### Visual Indicators
- **Month Bar**: 12 distinct colors, one per month
  - January: Blue (#3b82f6)
  - February: Purple (#8b5cf6)
  - March: Pink (#ec4899)
  - April: Orange (#f97316)
  - May: Yellow (#eab308)
  - June: Green (#22c55e)
  - July: Teal (#14b8a6)
  - August: Cyan (#06b6d4)
  - September: Indigo (#6366f1)
  - October: Violet (#a855f7)
  - November: Rose (#f43f5e)
  - December: Sky Blue (#0ea5e9)

- **Week Bar**: Subtle gray tones that cycle through 8 shades

### Weekend Styling
- Weekend columns have a warmer peach/cream background (#faf5f2)
- Weekend day labels use amber color (#b45309)

### Account Colors
- Work: Blue (#3b82f6)
- Private: Green (#22c55e)

### Hour Display
- Day view shows hours 07:00-22:00 (15 hours visible)
- Events outside this range are clipped at boundaries
- Configurable via START_HOUR and END_HOUR constants in DayColumn.tsx

## Future Improvements

1. **Backend Token Vault** - Store refresh tokens server-side for persistent sessions
2. **Multiple Calendars** - Let users select which calendars to show
3. **Infinite Scroll** - Load more days when reaching edges
4. **Event Details** - Click to expand event info
5. **Keyboard Navigation** - Arrow keys, shortcuts
6. **Mobile Support** - Touch gestures, responsive layout
7. **Dark/Light Theme Toggle** - User preference for theme switching
