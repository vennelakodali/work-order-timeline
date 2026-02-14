import { Injectable } from '@angular/core';

/**
 * Service for hover button calculation logic.
 * Contains pure functions with no state or side effects.
 */
@Injectable({ providedIn: 'root' })
export class TimelineHoverService {

  /**
   * Determine if hover button should be shown based on cursor position and obstacles.
   * Returns true if cursor is in empty timeline space (not over work center column or order bars).
   */
  public shouldShowHoverButton(
    isOverWorkCenterColumn: boolean,
    isOverOrderBar: boolean,
    xInTimeline: number,
    bars: Array<{ left: number; width: number }>
  ): boolean {
    if (isOverWorkCenterColumn || isOverOrderBar) {
      return false;
    }

    return this.isOverEmptySpace(xInTimeline, bars);
  }

  /**
   * Convert client X coordinate to timeline X position.
   * Accounts for scroll position and work center column offset.
   */
  public clientXToTimelineX(
    clientX: number,
    scrollRect: DOMRect,
    workCenterColumnWidth: number,
    scrollLeft: number
  ): number {
    return clientX - scrollRect.left - workCenterColumnWidth + scrollLeft;
  }

  /**
   * Check if X position is in empty space (not overlapping any order bars).
   */
  private isOverEmptySpace(
    xPosition: number,
    bars: Array<{ left: number; width: number }>
  ): boolean {
    return !bars.some(bar => xPosition >= bar.left && xPosition <= bar.left + bar.width);
  }

  /**
   * Check if cursor is outside the hover button's interaction bounds.
   * Used to determine when to hide the button as cursor moves away.
   */
  public isCursorOutsideButtonBounds(
    cursorX: number,
    cursorY: number,
    buttonPosition: { x: number; y: number },
    buttonBounds: { width: number; height: number; margin: number }
  ): boolean {
    const distanceX = Math.abs(cursorX - buttonPosition.x);
    const distanceY = Math.abs(cursorY - buttonPosition.y);

    return (
      distanceX > (buttonBounds.width / 2 + buttonBounds.margin) ||
      distanceY > (buttonBounds.height / 2 + buttonBounds.margin)
    );
  }

  /**
   * Calculate hover button position from mouse event and row bounds.
   * Centers button vertically in the row.
   */
  public calculateButtonPosition(
    mouseEvent: { clientX: number; clientY: number },
    rowRect: { top: number; height: number }
  ): { x: number; y: number } {
    return {
      x: mouseEvent.clientX,
      y: rowRect.top + rowRect.height / 2
    };
  }
}
