/**
 * Convert an ISO date string to a pixel X-position on the timeline.
 * Uses linear interpolation: position = ratio * totalWidth.
 */
export function dateToPosition(
  dateStr: string,
  timelineStartDate: Date,
  timelineEndDate: Date,
  totalWidth: number
): number {
  const date = new Date(dateStr).getTime();
  const start = timelineStartDate.getTime();
  const end = timelineEndDate.getTime();
  const ratio = (date - start) / (end - start);
  return ratio * totalWidth;
}

/**
 * Convert a pixel X-position back to an ISO date string (YYYY-MM-DD).
 * Inverse of dateToPosition.
 */
export function positionToDate(
  xPos: number,
  timelineStartDate: Date,
  timelineEndDate: Date,
  totalWidth: number
): string {
  const start = timelineStartDate.getTime();
  const end = timelineEndDate.getTime();
  const ratio = xPos / totalWidth;
  const dateMs = start + ratio * (end - start);
  return new Date(dateMs).toISOString().split('T')[0];
}

/**
 * Calculate left position and width in pixels for a work order bar.
 * Enforces a minimum width of 40px for visibility.
 */
export function getBarStyle(
  startDate: string,
  endDate: string,
  timelineStartDate: Date,
  timelineEndDate: Date,
  totalWidth: number
): { left: number; width: number } {
  const left = dateToPosition(startDate, timelineStartDate, timelineEndDate, totalWidth);
  const right = dateToPosition(endDate, timelineStartDate, timelineEndDate, totalWidth);
  return { left, width: Math.max(right - left, 40) };
}
