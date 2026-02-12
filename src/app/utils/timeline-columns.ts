export interface TimelineColumn {
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface TimelineColumnConfig {
  columns: TimelineColumn[];
  columnWidth: number;
  timelineStartDate: Date;
  timelineEndDate: Date;
}

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
  const now = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  switch (timescale) {
    case 'Hour':
      return generateHourColumns(now);
    case 'Day':
      return generateDayColumns(now);
    case 'Week':
      return generateWeekColumns(now);
    case 'Month':
    default:
      return generateMonthColumns(now);
  }
}

function generateHourColumns(now: Date): TimelineColumnConfig {
  const columnWidth = 60;
  const start = new Date(now);
  start.setHours(start.getHours() - 12);
  const end = new Date(now);
  end.setHours(end.getHours() + 12);

  const columns: TimelineColumn[] = [];
  const current = new Date(start);
  while (current <= end) {
    const colStart = new Date(current);
    const colEnd = new Date(current);
    colEnd.setHours(colEnd.getHours() + 1);
    columns.push({
      label: current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      startDate: colStart,
      endDate: colEnd
    });
    current.setHours(current.getHours() + 1);
  }

  return { columns, columnWidth, timelineStartDate: new Date(start), timelineEndDate: new Date(end) };
}

function generateDayColumns(now: Date): TimelineColumnConfig {
  const columnWidth = 80;
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  const end = new Date(now);
  end.setDate(end.getDate() + 30);

  const columns: TimelineColumn[] = [];
  const current = new Date(start);
  while (current <= end) {
    const colStart = new Date(current);
    const colEnd = new Date(current);
    colEnd.setDate(colEnd.getDate() + 1);
    columns.push({
      label: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      startDate: colStart,
      endDate: colEnd
    });
    current.setDate(current.getDate() + 1);
  }

  return { columns, columnWidth, timelineStartDate: new Date(start), timelineEndDate: new Date(end) };
}

function generateWeekColumns(now: Date): TimelineColumnConfig {
  const columnWidth = 120;
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay() - 12 * 7);
  const end = new Date(now);
  end.setDate(end.getDate() + (6 - end.getDay()) + 12 * 7);

  const columns: TimelineColumn[] = [];
  const current = new Date(start);
  // Align to Monday
  current.setDate(current.getDate() - current.getDay() + 1);
  while (current <= end) {
    const colStart = new Date(current);
    const colEnd = new Date(current);
    colEnd.setDate(colEnd.getDate() + 7);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    columns.push({
      label: `${current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { day: 'numeric' })}`,
      startDate: colStart,
      endDate: colEnd
    });
    current.setDate(current.getDate() + 7);
  }

  return { columns, columnWidth, timelineStartDate: new Date(start), timelineEndDate: new Date(end) };
}

function generateMonthColumns(now: Date): TimelineColumnConfig {
  const columnWidth = 160;
  const start = new Date(now.getFullYear(), now.getMonth() - 8, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 9, 0);

  const columns: TimelineColumn[] = [];
  const current = new Date(start);
  while (current <= end) {
    const colStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const colEnd = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    columns.push({
      label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      startDate: colStart,
      endDate: colEnd
    });
    current.setMonth(current.getMonth() + 1);
  }

  return { columns, columnWidth, timelineStartDate: new Date(start), timelineEndDate: new Date(end) };
}
