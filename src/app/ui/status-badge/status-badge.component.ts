import { Component, Input } from '@angular/core';
import { WorkOrderStatus, STATUS_CONFIGS, StatusConfig } from '../../models/work-order.model';

/**
 * Reusable status badge component.
 * Renders a colored pill for the given work order status.
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span
      class="status-badge"
      [style.color]="config.textColor"
      [style.background]="config.bgColor"
    >{{ config.label }}</span>
  `,
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: WorkOrderStatus;

  get config(): StatusConfig {
    return STATUS_CONFIGS.find(s => s.value === this.status) || STATUS_CONFIGS[0];
  }
}
