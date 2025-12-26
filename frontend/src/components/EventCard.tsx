import type { CalEvent } from '../types';
import { formatEventTime } from '../utils/dateUtils';

type EventCardProps = {
  event: CalEvent;
  isCompact: boolean;
};

export function EventCard({ event, isCompact }: EventCardProps) {
  const isPending = event.rsvpStatus === 'needsAction';
  const cardClassName = isCompact 
    ? `event-chip${isPending ? ' rsvp-pending' : ''}`
    : `event-card${isPending ? ' rsvp-pending' : ''}`;

  if (isCompact) {
    return (
      <div
        className={cardClassName}
        style={{ backgroundColor: event.color }}
        title={`${event.title}${event.allDay ? '' : ` (${formatEventTime(event.startTs)})`}`}
      >
        <span className="event-chip-title" style={{ position: 'relative', zIndex: 1 }}>{event.title}</span>
      </div>
    );
  }

  return (
    <div
      className={cardClassName}
      style={{ backgroundColor: event.color }}
    >
      {!event.allDay && (
        <span className="event-time" style={{ position: 'relative', zIndex: 1 }}>{formatEventTime(event.startTs)}</span>
      )}
      <span className="event-title" style={{ position: 'relative', zIndex: 1 }}>{event.title}</span>
    </div>
  );
}

