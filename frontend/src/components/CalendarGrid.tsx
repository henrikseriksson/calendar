import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { DayColumn } from './DayColumn';
import type { CalEvent } from '../types';
import { getDateRange, startOfDay, isSameDay, getWeekNumber, getMonthIndex, getMonthName } from '../utils/dateUtils';

// Colors for each month (12 distinct colors)
const MONTH_COLORS = [
  '#3b82f6', // January - Blue
  '#8b5cf6', // February - Purple
  '#ec4899', // March - Pink
  '#f97316', // April - Orange
  '#eab308', // May - Yellow
  '#22c55e', // June - Green
  '#14b8a6', // July - Teal
  '#06b6d4', // August - Cyan
  '#6366f1', // September - Indigo
  '#a855f7', // October - Violet
  '#f43f5e', // November - Rose
  '#0ea5e9', // December - Sky Blue
];

// Colors for weeks (cycle through 8 colors)
const WEEK_COLORS = [
  '#64748b', // Slate
  '#6b7280', // Gray
  '#71717a', // Zinc
  '#78716c', // Stone
  '#737373', // Neutral
  '#7c7c7c', // Dark gray
  '#6e6e6e', // Mid gray
  '#5f5f5f', // Charcoal
];

type MonthSegment = {
  monthIndex: number;
  monthName: string;
  startIndex: number;
  endIndex: number;
};

type WeekSegment = {
  weekNumber: number;
  startIndex: number;
  endIndex: number;
};

type CalendarGridProps = {
  events: CalEvent[];
  pxPerDay: number;
  getEventsForDay: (date: Date) => CalEvent[];
  daysBeforeToday?: number;
  daysAfterToday?: number;
};

export function CalendarGrid({
  pxPerDay,
  getEventsForDay,
  daysBeforeToday = 60,
  daysAfterToday = 60,
}: CalendarGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevPxPerDayRef = useRef<number>(pxPerDay);

  // Generate date range
  const dates = useMemo(
    () => getDateRange(daysBeforeToday, daysAfterToday),
    [daysBeforeToday, daysAfterToday]
  );

  // Find today's index for initial scroll
  const todayIndex = useMemo(() => {
    const today = startOfDay(new Date());
    return dates.findIndex((d) => isSameDay(d, today));
  }, [dates]);

  // Calculate scroll offset based on zoom level
  const calculateScrollOffset = useCallback((pxPerDay: number, todayIndex: number, containerWidth: number): number => {
    const todayPosition = todayIndex * pxPerDay;
    
    // Determine days offset from left based on zoom level
    let daysOffset: number;
    if (pxPerDay >= 150) {
      // Day view (200px): Position today 1.5 days from left
      daysOffset = 1.5;
    } else if (pxPerDay >= 60) {
      // Week view (100px): Position today 0.5 days from left (first or second day)
      daysOffset = 0.5;
    } else {
      // Month view (30px): Position today 5 days from left (around day 4-7 in view)
      daysOffset = 5;
    }
    
    const offset = todayPosition - daysOffset * pxPerDay;
    return Math.max(0, offset);
  }, []);

  // Calculate month segments for the visible date range
  const monthSegments = useMemo((): MonthSegment[] => {
    const segments: MonthSegment[] = [];
    let currentMonth = -1;
    let segmentStart = 0;

    dates.forEach((date, index) => {
      const month = getMonthIndex(date);
      if (month !== currentMonth) {
        if (currentMonth !== -1) {
          segments.push({
            monthIndex: currentMonth,
            monthName: getMonthName(dates[segmentStart]),
            startIndex: segmentStart,
            endIndex: index - 1,
          });
        }
        currentMonth = month;
        segmentStart = index;
      }
    });

    // Add the last segment
    if (currentMonth !== -1) {
      segments.push({
        monthIndex: currentMonth,
        monthName: getMonthName(dates[segmentStart]),
        startIndex: segmentStart,
        endIndex: dates.length - 1,
      });
    }

    return segments;
  }, [dates]);

  // Calculate week segments for the visible date range
  const weekSegments = useMemo((): WeekSegment[] => {
    const segments: WeekSegment[] = [];
    let currentWeek = -1;
    let segmentStart = 0;

    dates.forEach((date, index) => {
      const week = getWeekNumber(date);
      if (week !== currentWeek) {
        if (currentWeek !== -1) {
          segments.push({
            weekNumber: currentWeek,
            startIndex: segmentStart,
            endIndex: index - 1,
          });
        }
        currentWeek = week;
        segmentStart = index;
      }
    });

    // Add the last segment
    if (currentWeek !== -1) {
      segments.push({
        weekNumber: currentWeek,
        startIndex: segmentStart,
        endIndex: dates.length - 1,
      });
    }

    return segments;
  }, [dates]);

  // Scroll to today on mount and when zoom changes
  useEffect(() => {
    if (scrollContainerRef.current && todayIndex >= 0) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      const offset = calculateScrollOffset(pxPerDay, todayIndex, containerWidth);
      scrollContainerRef.current.scrollLeft = offset;
      prevPxPerDayRef.current = pxPerDay;
    }
  }, [todayIndex, pxPerDay, calculateScrollOffset]);

  // Only render visible days + buffer for performance
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 30 });

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    
    const buffer = 10; // Extra days to render on each side
    const startIndex = Math.max(0, Math.floor(scrollLeft / pxPerDay) - buffer);
    const endIndex = Math.min(
      dates.length,
      Math.ceil((scrollLeft + containerWidth) / pxPerDay) + buffer
    );
    
    setVisibleRange({ start: startIndex, end: endIndex });
  }, [pxPerDay, dates.length]);

  // Initial calculation and scroll listener
  useEffect(() => {
    handleScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Total width of the scrollable content
  const totalWidth = dates.length * pxPerDay;

  // Filter visible month and week segments
  const visibleMonthSegments = monthSegments.filter(
    (seg) => seg.endIndex >= visibleRange.start && seg.startIndex <= visibleRange.end
  );

  const visibleWeekSegments = weekSegments.filter(
    (seg) => seg.endIndex >= visibleRange.start && seg.startIndex <= visibleRange.end
  );

  return (
    <div className="calendar-grid" ref={scrollContainerRef}>
      <div className="calendar-content" style={{ width: totalWidth }}>
        {/* Month indicator bars */}
        {visibleMonthSegments.map((segment) => {
          const left = segment.startIndex * pxPerDay;
          const width = (segment.endIndex - segment.startIndex + 1) * pxPerDay;
          return (
            <div
              key={`month-${segment.startIndex}`}
              className="month-bar"
              style={{
                left,
                width,
                backgroundColor: MONTH_COLORS[segment.monthIndex],
              }}
            >
              {segment.monthName}
            </div>
          );
        })}

        {/* Week indicator bars */}
        {visibleWeekSegments.map((segment) => {
          const left = segment.startIndex * pxPerDay;
          const width = (segment.endIndex - segment.startIndex + 1) * pxPerDay;
          return (
            <div
              key={`week-${segment.startIndex}`}
              className="week-bar"
              style={{
                left,
                width,
                backgroundColor: WEEK_COLORS[segment.weekNumber % WEEK_COLORS.length],
              }}
            >
              w. {segment.weekNumber}
            </div>
          );
        })}

        {/* Day columns */}
        {dates.slice(visibleRange.start, visibleRange.end).map((date, i) => {
          const actualIndex = visibleRange.start + i;
          return (
            <div
              key={date.toISOString()}
              className="day-wrapper"
              style={{
                position: 'absolute',
                left: actualIndex * pxPerDay,
                width: pxPerDay,
                height: '100%',
              }}
            >
              <DayColumn
                date={date}
                events={getEventsForDay(date)}
                pxPerDay={pxPerDay}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
