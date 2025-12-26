import {
  format,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  parseISO,
  isToday,
  isSameDay,
  differenceInMinutes,
  differenceInDays,
  startOfWeek,
  getHours,
  getMinutes,
  getWeek,
  getMonth,
} from 'date-fns';
import { sv } from 'date-fns/locale';

/**
 * Parse a Google Calendar date/dateTime string to a timestamp
 */
export function parseGoogleDate(dateStr: string, isAllDay: boolean): number {
  if (isAllDay) {
    // All-day events come as YYYY-MM-DD
    return startOfDay(parseISO(dateStr)).getTime();
  }
  return parseISO(dateStr).getTime();
}

/**
 * Format a date for display
 */
export function formatDayHeader(date: Date): string {
  return format(date, 'EEE d', { locale: sv });
}

/**
 * Format time for event display
 */
export function formatEventTime(timestamp: number): string {
  return format(new Date(timestamp), 'HH:mm');
}

/**
 * Get an array of dates centered around today
 */
export function getDateRange(daysBeforeToday: number, daysAfterToday: number): Date[] {
  const today = startOfDay(new Date());
  const dates: Date[] = [];

  for (let i = -daysBeforeToday; i <= daysAfterToday; i++) {
    dates.push(addDays(today, i));
  }

  return dates;
}

/**
 * Get the position (in percentage) of a time within the visible hour range
 */
export function getTimePosition(timestamp: number, startHour = 0, endHour = 24): number {
  const date = new Date(timestamp);
  const hours = getHours(date);
  const minutes = getMinutes(date);
  const totalMinutes = hours * 60 + minutes;
  const startMinutes = startHour * 60;
  const rangeMinutes = (endHour - startHour) * 60;
  return ((totalMinutes - startMinutes) / rangeMinutes) * 100;
}

/**
 * Get event height as percentage of visible hour range
 */
export function getEventHeight(startTs: number, endTs: number, startHour = 0, endHour = 24): number {
  const minutes = differenceInMinutes(new Date(endTs), new Date(startTs));
  const rangeMinutes = (endHour - startHour) * 60;
  return (minutes / rangeMinutes) * 100;
}

/**
 * Check if a date is today
 */
export { isToday, isSameDay, startOfDay, endOfDay, addDays, subDays, format };

/**
 * Get ISO date string for API calls
 */
export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get start of week (Monday)
 */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Get ISO week number (1-53)
 */
export function getWeekNumber(date: Date): number {
  return getWeek(date, { weekStartsOn: 1 });
}

/**
 * Get month index (0-11)
 */
export function getMonthIndex(date: Date): number {
  return getMonth(date);
}

/**
 * Get month name in Swedish
 */
export function getMonthName(date: Date): string {
  return format(date, 'MMMM', { locale: sv });
}

/**
 * Calculate the difference in days between two timestamps
 * For all-day events, this gives the number of days the event spans
 */
export function getDaysDifference(startTs: number, endTs: number): number {
  return differenceInDays(new Date(endTs), new Date(startTs));
}

