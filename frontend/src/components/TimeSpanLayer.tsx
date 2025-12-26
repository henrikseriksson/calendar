import { useMemo } from 'react';
import type { CalEvent } from '../types';
import { startOfDay, isSameDay, subDays } from '../utils/dateUtils';

type TimeSpanLayerProps = {
  timeSpans: CalEvent[];
  dates: Date[];
  pxPerDay: number;
  visibleRange: { start: number; end: number };
  onMaxRowsChange?: (maxRows: number) => void;
};

export function TimeSpanLayer({ timeSpans, dates, pxPerDay, visibleRange, onMaxRowsChange }: TimeSpanLayerProps) {
  // Calculate positions for visible time spans and assign rows for overlapping spans
  const visibleTimeSpans = useMemo(() => {
    // First, calculate basic positions for all spans
    const spansWithPositions = timeSpans
      .map((span) => {
        const startDate = startOfDay(new Date(span.startTs));
        // For all-day events, end date is exclusive, so subtract 1 day for visual representation
        const endDate = span.allDay 
          ? subDays(startOfDay(new Date(span.endTs)), 1)
          : startOfDay(new Date(span.endTs));
        
        // Find indices in the dates array
        const startIndex = dates.findIndex((d) => isSameDay(d, startDate));
        const endIndex = dates.findIndex((d) => isSameDay(d, endDate));
        
        // Skip if not in the date range
        if (startIndex === -1 && endIndex === -1) return null;
        
        // Calculate visible portion
        const visibleStart = Math.max(0, startIndex === -1 ? 0 : startIndex);
        const visibleEnd = Math.min(dates.length - 1, endIndex === -1 ? dates.length - 1 : endIndex);
        
        // Check if it overlaps with visible range
        if (visibleEnd < visibleRange.start || visibleStart > visibleRange.end) return null;
        
        // Calculate actual visible portion
        const actualStart = Math.max(visibleStart, visibleRange.start);
        const actualEnd = Math.min(visibleEnd, visibleRange.end);
        
        const left = actualStart * pxPerDay;
        const width = (actualEnd - actualStart + 1) * pxPerDay;
        
        return {
          span,
          left,
          width,
          startIndex: actualStart,
          endIndex: actualEnd,
          originalStartIndex: startIndex !== -1 ? startIndex : visibleStart,
          originalEndIndex: endIndex !== -1 ? endIndex : visibleEnd,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Sort by start index for row assignment
    spansWithPositions.sort((a, b) => a.originalStartIndex - b.originalStartIndex);

    // Assign rows to overlapping spans
    // Each row is an array of spans that don't overlap with each other
    const rows: typeof spansWithPositions[] = [];

    for (const span of spansWithPositions) {
      // Find the first row where this span doesn't overlap with any existing span
      let assignedRow = -1;
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        // Check if this span overlaps with any span in this row
        const overlaps = row.some((existingSpan) => {
          // Two spans overlap if one starts before the other ends
          return (
            span.originalStartIndex <= existingSpan.originalEndIndex &&
            span.originalEndIndex >= existingSpan.originalStartIndex
          );
        });
        
        if (!overlaps) {
          assignedRow = rowIndex;
          break;
        }
      }

      // If no row found, create a new one
      if (assignedRow === -1) {
        assignedRow = rows.length;
        rows.push([]);
      }

      // Assign the span to the row
      rows[assignedRow].push(span);
    }

    // Flatten and add row index to each span
    return spansWithPositions.map((span) => {
      // Find which row this span belongs to
      const rowIndex = rows.findIndex((row) => row.includes(span));
      return {
        ...span,
        rowIndex: rowIndex !== -1 ? rowIndex : 0,
      };
    });
  }, [timeSpans, dates, pxPerDay, visibleRange]);

  if (visibleTimeSpans.length === 0) {
    onMaxRowsChange?.(0);
    return null;
  }

  const rowHeight = 20;
  const rowGap = 2;
  const maxRows = Math.max(...visibleTimeSpans.map(s => s.rowIndex)) + 1;
  
  // Notify parent of max rows
  onMaxRowsChange?.(maxRows);

  return (
    <>
      {visibleTimeSpans.map(({ span, left, width, rowIndex }) => {
        // Calculate top position based on row index
        const top = 40 + rowIndex * (rowHeight + rowGap);
        
        return (
          <div
            key={span.id}
            className="time-span-bar"
            style={{
              left,
              width,
              top: `${top}px`,
              backgroundColor: span.color,
            }}
            title={span.title}
          >
            {/* Single sticky label at the left edge */}
            <span className="time-span-label">
              {span.title}
            </span>
          </div>
        );
      })}
    </>
  );
}

