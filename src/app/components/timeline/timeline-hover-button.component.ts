import { Component, Input, Output, EventEmitter, ViewChild, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-timeline-hover-button',
  standalone: true,
  imports: [CommonModule, NgbTooltipModule],
  templateUrl: './timeline-hover-button.component.html',
  styleUrls: ['./timeline-hover-button.component.scss']
})
export class TimelineHoverButtonComponent implements OnChanges, OnDestroy {
  @ViewChild('hoverButtonTooltip') hoverButtonTooltip?: NgbTooltip;

  @Input() position: { x: number; y: number } | null = null;
  @Output() buttonClick = new EventEmitter<{ x: number; y: number }>();
  @Output() leave = new EventEmitter<MouseEvent>();

  private tooltipTimeout?: ReturnType<typeof setTimeout>;
  private isTooltipOpen = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['position']) {
      const curr = changes['position'].currentValue;

      if (!curr) {
        this.clearTooltipTimeout();
        this.closeTooltip();
      } else if (!this.isTooltipOpen) {
        this.openTooltipWithDelay();
      }
    }
  }

  onClick(): void {
    if (this.position) {
      this.buttonClick.emit(this.position);
    }
  }

  onMouseLeave(event: MouseEvent): void {
    this.leave.emit(event);
  }

  ngOnDestroy(): void {
    this.clearTooltipTimeout();
    this.closeTooltip();
  }

  private openTooltipWithDelay(): void {
    this.clearTooltipTimeout();
    this.tooltipTimeout = setTimeout(() => {
      if (this.hoverButtonTooltip && this.position) {
        this.hoverButtonTooltip.open();
        this.isTooltipOpen = true;
      }
    }, 200);
  }

  private closeTooltip(): void {
    if (this.hoverButtonTooltip) {
      this.hoverButtonTooltip.close();
      this.isTooltipOpen = false;
    }
  }

  private clearTooltipTimeout(): void {
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = undefined;
    }
  }
}
