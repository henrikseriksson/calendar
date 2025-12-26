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
};

// Threshold for showing compact view
const COMPACT_THRESHOLD = 80;

export function DayColumn({ date, events, pxPerDay }: DayColumnProps) {
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
      <div className="day-header">
        <span className={labelClasses}>
          {formatDayHeader(date)}
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
        {isCompact ? (
          // Compact: just show chips
          <div className="compact-events">
            {timedEvents.slice(0, 5).map((event) => (
              <EventCard key={event.id} event={event} isCompact={true} />
            ))}
            {timedEvents.length > 5 && (
              <span className="more-events">+{timedEvents.length - 5} more</span>
            )}
          </div>
        ) : (
          // Detailed: show time grid (07:00 - 22:00)
          <div className="time-grid">
            {/* Hour lines */}
            {Array.from({ length: VISIBLE_HOURS + 1 }, (_, i) => {
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

            {/* Events positioned by time */}
            {timedEvents.map((event) => {
              const top = getTimePosition(event.startTs, START_HOUR, END_HOUR);
              const height = getEventHeight(event.startTs, event.endTs, START_HOUR, END_HOUR);
              
              // Skip events entirely outside the visible range
              if (top >= 100 || top + height <= 0) return null;
              
              return (
                <div
                  key={event.id}
                  className="positioned-event"
                  style={{
                    top: `${Math.max(0, top)}%`,
                    height: `${Math.max(Math.min(height, 100 - Math.max(0, top)), 2)}%`,
                  }}
                >
                  <EventCard event={event} isCompact={false} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

