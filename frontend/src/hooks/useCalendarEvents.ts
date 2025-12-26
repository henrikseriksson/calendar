import { useState, useEffect, useCallback } from 'react';
import type { AccountId, CalEvent, GoogleEventsResponse, GoogleCalendarEvent } from '../types';
import { parseGoogleDate, addDays, startOfDay, endOfDay, getDaysDifference } from '../utils/dateUtils';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const ACCOUNT_COLORS: Record<AccountId, string> = {
  work: '#3b82f6',    // Blue
  private: '#22c55e', // Green
};

// Different color palette for time spans (more muted, distinct from regular events)
const TIMESPAN_COLORS: Record<AccountId, string> = {
  work: '#6366f1',    // Indigo (more muted blue)
  private: '#10b981', // Emerald (more muted green)
};

function normalizeEvent(event: GoogleCalendarEvent, accountId: AccountId): CalEvent {
  const isAllDay = !event.start.dateTime;
  const startStr = event.start.dateTime || event.start.date || '';
  const endStr = event.end.dateTime || event.end.date || '';

  // Extract user's RSVP status from attendees
  let rsvpStatus: CalEvent['rsvpStatus'] = undefined;
  if (event.attendees && event.attendees.length > 0) {
    // Find the attendee entry for the current user (self === true)
    const userAttendee = event.attendees.find(attendee => attendee.self === true);
    if (userAttendee && userAttendee.responseStatus) {
      rsvpStatus = userAttendee.responseStatus;
    }
  }
  // If there are no attendees or user is the organizer, assume accepted (no RSVP needed)
  // Events without attendees array are typically events the user created

  const startTs = parseGoogleDate(startStr, isAllDay);
  const endTs = parseGoogleDate(endStr, isAllDay);
  
  // Detect time spans: all-day events spanning 2+ days
  const isTimeSpan = isAllDay && getDaysDifference(startTs, endTs) >= 2;

  return {
    id: `${accountId}-${event.id}`,
    accountId,
    title: event.summary || '(No title)',
    allDay: isAllDay,
    start: startStr,
    end: endStr,
    timeZone: event.start.timeZone,
    startTs,
    endTs,
    // Use different colors for time spans
    color: isTimeSpan ? TIMESPAN_COLORS[accountId] : ACCOUNT_COLORS[accountId],
    rsvpStatus,
    isTimeSpan,
  };
}

async function fetchEventsForAccount(
  accessToken: string,
  accountId: AccountId,
  timeMin: Date,
  timeMax: Date
): Promise<CalEvent[]> {
  const events: CalEvent[] = [];
  let pageToken: string | undefined;

  // Debug: Log token info
  console.log(`[${accountId}] Fetching events with token:`, accessToken?.substring(0, 20) + '...');

  do {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
      showDeleted: 'false',
    });

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const url = `${CALENDAR_API_BASE}/calendars/primary/events?${params}`;
    console.log(`[${accountId}] Request URL:`, url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    console.log(`[${accountId}] Response status:`, response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[${accountId}] Error response:`, errorBody);
      throw new Error(`Calendar API error: ${response.status}`);
    }

    const data: GoogleEventsResponse = await response.json();
    
    for (const item of data.items || []) {
      events.push(normalizeEvent(item, accountId));
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return events;
}

type UseCalendarEventsOptions = {
  getToken: (accountId: AccountId) => string | null;
  daysBeforeToday?: number;
  daysAfterToday?: number;
};

export function useCalendarEvents({
  getToken,
  daysBeforeToday = 60,
  daysAfterToday = 60,
}: UseCalendarEventsOptions) {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    const workToken = getToken('work');
    const privateToken = getToken('private');

    if (!workToken && !privateToken) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    const today = startOfDay(new Date());
    const timeMin = startOfDay(addDays(today, -daysBeforeToday));
    const timeMax = endOfDay(addDays(today, daysAfterToday));

    try {
      const fetchPromises: Promise<CalEvent[]>[] = [];

      if (workToken) {
        fetchPromises.push(fetchEventsForAccount(workToken, 'work', timeMin, timeMax));
      }
      if (privateToken) {
        fetchPromises.push(fetchEventsForAccount(privateToken, 'private', timeMin, timeMax));
      }

      const results = await Promise.all(fetchPromises);
      const allEvents = results.flat();

      // Sort by start time
      allEvents.sort((a, b) => a.startTs - b.startTs);

      setEvents(allEvents);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [getToken, daysBeforeToday, daysAfterToday]);

  // Fetch on mount and when tokens change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Get events for a specific day (excluding time spans)
  const getEventsForDay = useCallback(
    (date: Date): CalEvent[] => {
      const dayStart = startOfDay(date).getTime();
      const dayEnd = endOfDay(date).getTime();

      return events.filter((event) => {
        // Event overlaps with this day
        const overlapsDay = event.startTs < dayEnd && event.endTs > dayStart;
        // Hide events where user has RSVP'd NO
        const notDeclined = event.rsvpStatus !== 'declined';
        // Exclude time spans from regular event display (they're shown in a separate layer)
        const notTimeSpan = !event.isTimeSpan;
        return overlapsDay && notDeclined && notTimeSpan;
      });
    },
    [events]
  );

  // Get time spans (for separate rendering)
  const getTimeSpans = useCallback((): CalEvent[] => {
    return events.filter((event) => {
      const notDeclined = event.rsvpStatus !== 'declined';
      return event.isTimeSpan && notDeclined;
    });
  }, [events]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    getEventsForDay,
    getTimeSpans,
  };
}

