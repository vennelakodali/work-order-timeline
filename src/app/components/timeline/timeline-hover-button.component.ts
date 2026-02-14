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
  @ViewChild('hoverButtonTooltip') public hoverButtonTooltip?: NgbTooltip;

  @Input() public position: { x: number; y: number } | null = null;
  @Output() public buttonClick = new EventEmitter<{ x: number; y: number }>();
  @Output() public leave = new EventEmitter<MouseEvent>();

  private tooltipTimeout?: ReturnType<typeof setTimeout>;
  private isTooltipOpen = false;

  public ngOnChanges(changes: SimpleChanges): void {
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

  public onClick(): void {
    if (this.position) {
      this.buttonClick.emit(this.position);
    }
  }

  public onMouseLeave(event: MouseEvent): void {
    this.leave.emit(event);
  }

  public ngOnDestroy(): void {
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
