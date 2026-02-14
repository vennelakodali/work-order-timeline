import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { TimescaleLevels } from '../../models/work-order.model';

/**
 * Timeline Header Component
 *
 * Displays the "Work Orders" title, timescale selector dropdown, and "Today" button.
 * Separated from the main timeline to give the header its own single responsibility.
 */
@Component({
  selector: 'app-timeline-header',
  standalone: true,
  imports: [CommonModule, DropdownComponent],
  templateUrl: './timeline-header.component.html',
  styleUrls: ['./timeline-header.component.scss']
})
export class TimelineHeaderComponent {
  @Input({ required: true }) public currentTimescale!: string;
  @Output() public timescaleChange = new EventEmitter<string>();
  @Output() public todayClick = new EventEmitter<void>();

  public readonly timescaleLevels = TimescaleLevels;

  public readonly timescaleOptions: { value: string; label: string }[] = Object.entries(TimescaleLevels)
    .map(([value, label]) => ({ value: label, label }));

  public getTimescaleDisplay(): string {
    return this.currentTimescale;
  }
}
