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
  @Input({ required: true }) currentTimescale!: string;
  @Output() timescaleChange = new EventEmitter<string>();
  @Output() todayClick = new EventEmitter<void>();

  readonly timescaleLevels = TimescaleLevels;

  readonly timescaleOptions: { value: string; label: string }[] = Object.entries(TimescaleLevels)
    .map(([value, label]) => ({ value: label, label }));

  getTimescaleDisplay(): string {
    return this.currentTimescale;
  }
}
