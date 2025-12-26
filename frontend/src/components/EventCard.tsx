import type { CalEvent } from '../types';
import { formatEventTime } from '../utils/dateUtils';

type EventCardProps = {
  event: CalEvent;
  isCompact: boolean;
};

export function EventCard({ event, isCompact }: EventCardProps) {
  if (isCompact) {
    return (
      <div
        className="event-chip"
        style={{ backgroundColor: event.color }}
        title={`${event.title}${event.allDay ? '' : ` (${formatEventTime(event.startTs)})`}`}
      >
        <span className="event-chip-title">{event.title}</span>
      </div>
    );
  }

  return (
    <div
      className="event-card"
      style={{ backgroundColor: event.color }}
    >
      {!event.allDay && (
        <span className="event-time">{formatEventTime(event.startTs)}</span>
      )}
      <span className="event-title">{event.title}</span>
    </div>
  );
}

