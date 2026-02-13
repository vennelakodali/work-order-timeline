import { Injectable } from '@angular/core';

interface HoverButtonBounds {
  width: number;
  height: number;
  margin: number;
}

@Injectable({
  providedIn: 'root'
})
export class TimelineHoverService {
  private readonly bounds: HoverButtonBounds = {
    width: 113,
    height: 38,
    margin: 20
  };

  isOverWorkCenterColumn(event: MouseEvent, workCenterWidth: number): boolean {
    const target = event.target as HTMLElement;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const xInRow = event.clientX - rect.left;
    return target.closest('.work-center-cell') !== null || xInRow < workCenterWidth;
  }

  isOverOrderBar(event: MouseEvent): boolean {
    return (event.target as HTMLElement).closest('app-work-order-bar') !== null;
  }

  isOverEmptySpace(xPosition: number, bars: Array<{ left: number; width: number }>): boolean {
    return !bars.some(bar => xPosition >= bar.left && xPosition <= bar.left + bar.width);
  }

  isCursorOutsideButtonBounds(event: MouseEvent, buttonPosition: { x: number; y: number }): boolean {
    const distanceX = Math.abs(event.clientX - buttonPosition.x);
    const distanceY = Math.abs(event.clientY - buttonPosition.y);
    return distanceX > (this.bounds.width / 2 + this.bounds.margin) ||
           distanceY > (this.bounds.height / 2 + this.bounds.margin);
  }

  getTimelineX(event: MouseEvent, scrollLeft: number, workCenterWidth: number): number {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const xInRow = event.clientX - rect.left;
    return xInRow + scrollLeft - workCenterWidth;
  }
}
