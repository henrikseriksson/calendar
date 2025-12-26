import { isWeekend } from 'date-fns';
import type { CalEvent } from '../types';
import { EventCard } from './EventCard';
import { formatDayHeader, isToday, getTimePosition, getEventHeight } from '../utils/dateUtils';

// Hour range to display (7:00 - 22:00)
const START_HOUR = 7;
const END_HOUR = 22;
const VISIBLE_HOURS = END_HOUR - START_HOUR;

type DayColumnProps = {
  date: Date;
  events: CalEvent[];
  pxPerDay: number;
  timeSpanRows?: number;
};

// Threshold for showing compact view
const COMPACT_THRESHOLD = 80;

export function DayColumn({ date, events, pxPerDay, timeSpanRows = 0 }: DayColumnProps) {
  const isCompact = pxPerDay < COMPACT_THRESHOLD;
  const isTodayDate = isToday(date);
  const isWeekendDate = isWeekend(date);

  // Separate all-day and timed events
  const allDayEvents = events.filter((e) => e.allDay);
  const timedEvents = events.filter((e) => !e.allDay);

  // Build class names
  const columnClasses = [
    'day-column',
    isTodayDate && 'today',
    isWeekendDate && 'weekend',
  ].filter(Boolean).join(' ');

  const labelClasses = [
    'day-label',
    isTodayDate && 'today-label',
    isWeekendDate && !isTodayDate && 'weekend-label',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={columnClasses}
      style={{ width: pxPerDay }}
    >
      <div 
        className="day-header"
        style={{
          paddingTop: timeSpanRows > 0 
            ? `${62 + (timeSpanRows - 1) * 22}px` 
            : '62px'
        }}
      >
        <span className={labelClasses}>
          {formatDayHeader(date, isCompact)}
        </span>
      </div>

      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="all-day-section">
          {allDayEvents.map((event) => (
            <EventCard key={event.id} event={event} isCompact={isCompact} />
          ))}
        </div>
      )}

      {/* Timed events */}
      <div className="day-content">
        <div className="time-grid">
          {/* Hour lines - only show when not compact */}
          {!isCompact && Array.from({ length: VISIBLE_HOURS + 1 }, (_, i) => {
            const hour = START_HOUR + i;
            return (
              <div 
                key={hour} 
                className="hour-line" 
                style={{ top: `${(i / VISIBLE_HOURS) * 100}%` }}
              >
                <span className="hour-label">{hour.toString().padStart(2, '0')}</span>
              </div>
            );
          })}

          {/* Events positioned by time - always positioned regardless of zoom */}
          {timedEvents.map((event) => {
            const top = getTimePosition(event.startTs, START_HOUR, END_HOUR);
            const height = getEventHeight(event.startTs, event.endTs, START_HOUR, END_HOUR);
            
            // Skip events entirely outside the visible range
            if (top >= 100 || top + height <= 0) return null;
            
            // Calculate actual top and height
            // Use the full calculated height unless the event extends beyond the container
            const actualTop = Math.max(0, top);
            let actualHeight = height;
            
            // If event starts above visible area, adjust height
            if (top < 0) {
              actualHeight = height + top; // Reduce height by the amount above
            }
            
            // Only clip height if event extends below the visible area (100%)
            // This ensures events maintain their correct height based on time duration
            const bottomPosition = actualTop + actualHeight;
            if (bottomPosition > 100) {
              actualHeight = 100 - actualTop;
            }
            
            // Ensure minimum height for visibility
            actualHeight = Math.max(actualHeight, 2);
            
            return (
              <div
                key={event.id}
                className="positioned-event"
                style={{
                  top: `${actualTop}%`,
                  height: `${actualHeight}%`,
                }}
              >
                <EventCard event={event} isCompact={isCompact} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

