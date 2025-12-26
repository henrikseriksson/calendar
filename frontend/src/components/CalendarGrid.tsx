import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { DayColumn } from './DayColumn';
import { TimeSpanLayer } from './TimeSpanLayer';
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

/**
 * Lighten a hex color by mixing it with white
 */
function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  
  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);
  
  return `rgb(${newR}, ${newG}, ${newB})`;
}

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
  onZoomChange: (px: number) => void;
  getEventsForDay: (date: Date) => CalEvent[];
  getTimeSpans: () => CalEvent[];
  daysBeforeToday?: number;
  daysAfterToday?: number;
  minZoom?: number;
  maxZoom?: number;
};

export function CalendarGrid({
  pxPerDay,
  onZoomChange,
  getEventsForDay,
  getTimeSpans,
  daysBeforeToday = 60,
  daysAfterToday = 60,
  minZoom = 30,
  maxZoom = 250,
}: CalendarGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevPxPerDayRef = useRef<number>(pxPerDay);
  const isInitialMountRef = useRef<boolean>(true);
  const centerDayIndexRef = useRef<number | null>(null);
  const centerContainerWidthRef = useRef<number | null>(null);
  const pendingScrollAdjustmentRef = useRef<{ centerDayIndex: number; newPxPerDay: number; containerWidth: number } | null>(null);
  const [maxTimeSpanRows, setMaxTimeSpanRows] = useState(0);

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

  // Scroll to today on initial mount, or maintain center when zooming
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    
    if (isInitialMountRef.current && todayIndex >= 0) {
      // Initial mount: position today
      const containerWidth = container.clientWidth;
      const offset = calculateScrollOffset(pxPerDay, todayIndex, containerWidth);
      // Use requestAnimationFrame for Safari compatibility
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = offset;
        }
      });
      isInitialMountRef.current = false;
    } else if (prevPxPerDayRef.current !== pxPerDay && !pendingScrollAdjustmentRef.current) {
      // Zoom changed via button/slider (not wheel): maintain center day in the center
      // Calculate center day index from current scroll position using OLD pxPerDay
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const centerPosition = scrollLeft + containerWidth / 2;
      const centerDayIndex = centerPosition / prevPxPerDayRef.current;
      
      // Calculate new scroll position to keep the same day centered
      const newCenterPosition = centerDayIndex * pxPerDay;
      const newScrollLeft = newCenterPosition - containerWidth / 2;
      
      // Use requestAnimationFrame for Safari compatibility
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            const currentContainerWidth = scrollContainerRef.current.clientWidth;
            const finalScrollLeft = centerDayIndex * pxPerDay - currentContainerWidth / 2;
            scrollContainerRef.current.scrollLeft = Math.max(0, finalScrollLeft);
          }
        });
      });
    }
    
    prevPxPerDayRef.current = pxPerDay;
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

  // Mouse wheel zoom handler
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // Zoom with vertical scroll (deltaY), allow horizontal scroll (deltaX) to pass through
    const isVerticalScroll = Math.abs(e.deltaY) > Math.abs(e.deltaX);
    
    if (isVerticalScroll) {
      e.preventDefault();
      e.stopPropagation();
      
      // Calculate the center day index before zooming
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollLeft = container.scrollLeft;
        const containerWidth = container.clientWidth;
        const centerPosition = scrollLeft + containerWidth / 2;
        const centerDayIndex = centerPosition / pxPerDay;
        
        // Proportional zoom step (2% of current zoom level - slower zoom)
        const zoomStep = Math.max(1, Math.round(pxPerDay * 0.02));
        const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
        const newPxPerDay = Math.max(minZoom, Math.min(maxZoom, pxPerDay + delta));
        
        if (newPxPerDay !== pxPerDay) {
          // Save scroll adjustment info to apply after React re-renders
          pendingScrollAdjustmentRef.current = {
            centerDayIndex,
            newPxPerDay,
            containerWidth
          };
          
          onZoomChange(newPxPerDay);
          
          // Apply scroll adjustment after React has rendered with new pxPerDay
          // Use multiple requestAnimationFrame to wait for layout update
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (scrollContainerRef.current && pendingScrollAdjustmentRef.current) {
                  const { centerDayIndex: savedCenterDayIndex, newPxPerDay: savedNewPxPerDay, containerWidth: savedContainerWidth } = pendingScrollAdjustmentRef.current;
                  const currentContainerWidth = scrollContainerRef.current.clientWidth;
                  const centerPosition = savedCenterDayIndex * savedNewPxPerDay;
                  const newScrollLeft = centerPosition - currentContainerWidth / 2;
                  scrollContainerRef.current.scrollLeft = Math.max(0, newScrollLeft);
                  pendingScrollAdjustmentRef.current = null;
                }
              });
            });
          });
        }
      }
    }
    // If horizontal scroll, let it pass through for normal scrolling
  }, [pxPerDay, onZoomChange, minZoom, maxZoom]);

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
    <div className="calendar-grid" ref={scrollContainerRef} onWheel={handleWheel}>
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
              <span className="month-bar-label">{segment.monthName}</span>
            </div>
          );
        })}

        {/* Week indicator bars */}
        {visibleWeekSegments.map((segment) => {
          const left = segment.startIndex * pxPerDay;
          const width = (segment.endIndex - segment.startIndex + 1) * pxPerDay;
          const baseColor = WEEK_COLORS[segment.weekNumber % WEEK_COLORS.length];
          // Make every other week lighter
          const isEvenWeek = segment.weekNumber % 2 === 0;
          const backgroundColor = isEvenWeek ? baseColor : lightenColor(baseColor, 0.3);
          return (
            <div
              key={`week-${segment.startIndex}`}
              className="week-bar"
              style={{
                left,
                width,
                backgroundColor,
              }}
            >
              <span className="week-bar-label">w. {segment.weekNumber}</span>
            </div>
          );
        })}

        {/* Time span layer */}
        <TimeSpanLayer
          timeSpans={getTimeSpans()}
          dates={dates}
          pxPerDay={pxPerDay}
          visibleRange={visibleRange}
          onMaxRowsChange={setMaxTimeSpanRows}
        />

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
                timeSpanRows={maxTimeSpanRows}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
