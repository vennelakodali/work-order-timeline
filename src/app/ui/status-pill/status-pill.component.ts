import { Component, Input } from '@angular/core';
import { WorkOrderStatus, STATUS_CONFIGS, StatusConfig } from '../../models/work-order.model';

/**
 * Reusable status pill component.
 * Renders a colored pill for use in dropdowns and form selectors.
 */
@Component({
  selector: 'app-status-pill',
  standalone: true,
  templateUrl: './status-pill.component.html',
  styleUrls: ['./status-pill.component.scss']
})
export class StatusPillComponent {
  @Input({ required: true }) status!: WorkOrderStatus;

  get config(): StatusConfig {
    return STATUS_CONFIGS.find(s => s.value === this.status) || STATUS_CONFIGS[0];
  }
}
