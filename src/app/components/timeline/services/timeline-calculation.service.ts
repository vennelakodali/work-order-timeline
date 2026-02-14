import { Injectable } from '@angular/core';
import { WorkOrderDocument } from '../../../models/work-order.model';
import {
  generateTimelineColumns,
  TimelineColumnConfig
} from '../utils/timeline-columns';

/**
 * Service for timeline position and column calculations.
 */
@Injectable({ providedIn: 'root' })
export class TimelineCalculationService {

  public generateColumns(timescale: string, referenceDate?: Date): TimelineColumnConfig {
    return generateTimelineColumns(timescale, referenceDate);
  }

  /**
   * Calculate left position and width for a work order bar.
   */
  public calculateBarStyle(
    order: WorkOrderDocument,
    config: TimelineColumnConfig,
    totalWidth: number
  ): { left: number; width: number } {
    const left = this.dateToPosition(order.data.startDate, config, totalWidth);
    const right = this.dateToPosition(order.data.endDate, config, totalWidth);
    return { left, width: Math.max(right - left, 40) };
  }

  /**
   * Calculate the pixel position of today's date on the timeline.
   * Includes the work center column offset.
   */
  public calculateTodayPosition(
    columnConfig: TimelineColumnConfig,
    totalWidth: number,
    workCenterColumnWidth: number
  ): number {
    const todayStr = new Date().toISOString().split('T')[0];
    const positionInTimeline = this.dateToPosition(todayStr, columnConfig, totalWidth);
    return workCenterColumnWidth + positionInTimeline;
  }

  /**
   * Convert a pixel X-position to an ISO date string.
   */
  public positionToDate(
    xPosition: number,
    config: TimelineColumnConfig,
    totalWidth: number
  ): string {
    const { timelineStartDate, timelineEndDate } = config;
    const start = timelineStartDate.getTime();
    const end = timelineEndDate.getTime();
    const ratio = xPosition / totalWidth;
    const dateMs = start + ratio * (end - start);
    return new Date(dateMs).toISOString().split('T')[0];
  }

  /**
   * Convert an ISO date string to a pixel X-position.
   */
  public dateToPosition(
    dateStr: string,
    config: TimelineColumnConfig,
    totalWidth: number
  ): number {
    const { timelineStartDate, timelineEndDate } = config;
    const date = new Date(dateStr).getTime();
    const start = timelineStartDate.getTime();
    const end = timelineEndDate.getTime();
    const ratio = (date - start) / (end - start);
    return ratio * totalWidth;
  }

  /**
   * Check if a date falls within a given start and end range.
   */
  public isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
    return date >= startDate && date < endDate;
  }
}
