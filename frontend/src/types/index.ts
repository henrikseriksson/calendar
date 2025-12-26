export type AccountId = 'work' | 'private';

export type CalEvent = {
  id: string;
  accountId: AccountId;
  title: string;
  allDay: boolean;
  start: string; // ISO dateTime or YYYY-MM-DD
  end: string;   // ISO dateTime or YYYY-MM-DD
  timeZone?: string;
  startTs: number; // ms since epoch (for sorting/positioning)
  endTs: number;   // ms since epoch
  color?: string;  // For visual distinction
};

export type TokenData = {
  accessToken: string;
  expiresAt: number; // ms since epoch
};

export type AuthState = {
  work: TokenData | null;
  private: TokenData | null;
};

// Google Calendar API response types
export type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
};

export type GoogleEventsResponse = {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
};

