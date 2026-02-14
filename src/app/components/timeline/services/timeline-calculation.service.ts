import { Injectable } from '@angular/core';
import { WorkOrderDocument } from '../../../models/work-order.model';
import {
  generateTimelineColumns,
  TimelineColumnConfig
} from '../utils/timeline-columns';
import {
  dateToPosition,
  positionToDate,
  getBarStyle
} from '../utils/timeline-positioning';

/**
 * Service for timeline position and column calculations.
 * Wraps existing utility functions and provides context-aware methods.
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
    return getBarStyle(
      order.data.startDate,
      order.data.endDate,
      config.timelineStartDate,
      config.timelineEndDate,
      totalWidth
    );
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
    const positionInTimeline = dateToPosition(
      todayStr,
      columnConfig.timelineStartDate,
      columnConfig.timelineEndDate,
      totalWidth
    );
    return workCenterColumnWidth + positionInTimeline;
  }

  /**
   * Convert a pixel X-position to an ISO date string.
   * Wraps the positionToDate utility function.
   */
  public positionToDate(
    xPosition: number,
    config: TimelineColumnConfig,
    totalWidth: number
  ): string {
    return positionToDate(
      xPosition,
      config.timelineStartDate,
      config.timelineEndDate,
      totalWidth
    );
  }

  /**
   * Convert an ISO date string to a pixel X-position.
   * Wraps the dateToPosition utility function.
   */
  public dateToPosition(
    dateStr: string,
    config: TimelineColumnConfig,
    totalWidth: number
  ): number {
    return dateToPosition(
      dateStr,
      config.timelineStartDate,
      config.timelineEndDate,
      totalWidth
    );
  }
}
