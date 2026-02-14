export type TimelineColumn = {
  label: string;
  startDate: Date;
  endDate: Date;
}

export type TimelineColumnConfig = {
  columns: TimelineColumn[];
  columnWidth: number;
  timelineStartDate: Date;
  timelineEndDate: Date;
}

// Timeline configuration constants
const TIMESCALE_CONFIG = {
  Hour: { columnWidth: 60, range: 12, unit: 'hour' as const },
  Day: { columnWidth: 80, range: 30, unit: 'day' as const },
  Week: { columnWidth: 120, range: 12, unit: 'week' as const },
  Month: { columnWidth: 160, range: 8, unit: 'month' as const },
} as const;

const DAYS_PER_WEEK = 7;

// Date helper functions
const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Returns the start of the next month (consistent with other interval endpoints)
const getMonthEnd = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
};

// Align date to the previous Monday (or same day if already Monday)
const alignToMonday = (date: Date): Date => {
  const dayOfWeek = date.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0, so it's 6 days from Monday
  return addDays(date, -daysFromMonday);
};

const countPeriods = (start: Date, end: Date, incrementFn: (d: Date) => Date): number => {
  let count = 0;
  let current = new Date(start);
  while (current <= end) {
    count++;
    current = incrementFn(current);
  }
  return count;
};

/**
 * Generate timeline columns for a given timescale, centered around a reference date.
 *
 * Hour:  60px columns, +/-12 hours, 1-hour increments
 * Day:   80px columns, +/-30 days,  1-day increments
 * Week:  120px columns, +/-12 weeks, 7-day increments (Monday-aligned)
 * Month: 160px columns, +/-8 months, 1-month increments
 */
export function generateTimelineColumns(
  timescale: string,
  referenceDate: Date = new Date()
): TimelineColumnConfig {
  const normalizedDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  switch (timescale) {
    case 'Hour':
      return generateHourColumns(normalizedDate);
    case 'Day':
      return generateDayColumns(normalizedDate);
    case 'Week':
      return generateWeekColumns(normalizedDate);
    case 'Month':
    default:
      return generateMonthColumns(normalizedDate);
  }
}

function generateHourColumns(now: Date): TimelineColumnConfig {
  const { columnWidth, range } = TIMESCALE_CONFIG.Hour;
  const startDate = addHours(now, -range);
  const endDate = addHours(now, range);

  const columnCount = countPeriods(startDate, endDate, (d) => addHours(d, 1));

  const columns: TimelineColumn[] = Array.from({ length: columnCount }, (_, index) => {
    const colStart = addHours(startDate, index);
    const colEnd = addHours(colStart, 1);

    return {
      label: colStart.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      startDate: colStart,
      endDate: colEnd,
    };
  });

  return { columns, columnWidth, timelineStartDate: startDate, timelineEndDate: endDate };
}

function generateDayColumns(now: Date): TimelineColumnConfig {
  const { columnWidth, range } = TIMESCALE_CONFIG.Day;
  const startDate = addDays(now, -range);
  const endDate = addDays(now, range);

  const columnCount = countPeriods(startDate, endDate, (d) => addDays(d, 1));

  const columns: TimelineColumn[] = Array.from({ length: columnCount }, (_, index) => {
    const colStart = addDays(startDate, index);
    const colEnd = addDays(colStart, 1);

    return {
      label: colStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      startDate: colStart,
      endDate: colEnd,
    };
  });

  return { columns, columnWidth, timelineStartDate: startDate, timelineEndDate: endDate };
}

function generateWeekColumns(now: Date): TimelineColumnConfig {
  const { columnWidth, range } = TIMESCALE_CONFIG.Week;

  // Calculate symmetric range around current date
  const rangeInDays = range * DAYS_PER_WEEK;
  const dayOfWeek = now.getDay();

  // Start: go back by current day of week, then back by range in weeks
  const startBoundary = addDays(now, -dayOfWeek - rangeInDays);
  // End: go forward to end of week (Saturday), then forward by range in weeks
  const endBoundary = addDays(now, (6 - dayOfWeek) + rangeInDays);

  // Align start to Monday for column generation
  const startDate = alignToMonday(startBoundary);

  const columnCount = countPeriods(startDate, endBoundary, (d) => addDays(d, DAYS_PER_WEEK));

  const columns: TimelineColumn[] = Array.from({ length: columnCount }, (_, index) => {
    const colStart = addDays(startDate, index * DAYS_PER_WEEK);
    const colEnd = addDays(colStart, DAYS_PER_WEEK);
    const weekEnd = addDays(colStart, DAYS_PER_WEEK - 1);

    const startLabel = colStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = weekEnd.toLocaleDateString('en-US', { day: 'numeric' });

    return {
      label: `${startLabel} - ${endLabel}`,
      startDate: colStart,
      endDate: colEnd,
    };
  });

  return { columns, columnWidth, timelineStartDate: startBoundary, timelineEndDate: endBoundary };
}

function generateMonthColumns(now: Date): TimelineColumnConfig {
  const { columnWidth, range } = TIMESCALE_CONFIG.Month;
  const startDate = getMonthStart(addMonths(now, -range));
  // End boundary is the last day of the target month (month +range)
  const endBoundary = new Date(now.getFullYear(), now.getMonth() + range + 1, 0);

  const columnCount = countPeriods(startDate, endBoundary, (d) => addMonths(d, 1));

  const columns: TimelineColumn[] = Array.from({ length: columnCount }, (_, index) => {
    const colStart = getMonthStart(addMonths(startDate, index));
    const colEnd = getMonthEnd(addMonths(startDate, index));

    return {
      label: colStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      startDate: colStart,
      endDate: colEnd,
    };
  });

  return { columns, columnWidth, timelineStartDate: startDate, timelineEndDate: endBoundary };
}
