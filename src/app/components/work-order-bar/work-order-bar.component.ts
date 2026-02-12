import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusConfig, WorkOrderDocument } from '../../models/work-order.model';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { PillComponent } from '../../ui/pill/pill.component';

const WORK_ORDER_BAR_CONFIG: StatusConfig[] = [
  { value: 'open', label: 'Open', textColor: 'var(--status-open-text)', bgColor: 'var(--status-open-badge-bg)', borderColor: 'var(--status-open-badge-border)' },
  { value: 'in-progress', label: 'In Progress', textColor: 'var(--status-in-progress-text)', bgColor: 'var(--status-in-progress-badge-bg)', borderColor: 'var(--status-in-progress-badge-border)' },
  { value: 'complete', label: 'Complete', textColor: 'var(--status-complete-text)', bgColor: 'var(--status-complete-badge-bg)', borderColor: 'var(--status-complete-badge-border)' },
  { value: 'blocked', label: 'Blocked', textColor: 'var(--status-blocked-text)', bgColor: 'var(--status-blocked-badge-bg)', borderColor: 'var(--status-blocked-badge-border)' }
];

const STATUS_PILL_CONFIG: StatusConfig[] = [
  { value: 'open', label: 'Open', textColor: 'var(--status-open-text)', bgColor: 'var(--status-open-pill-bg)', borderColor: 'var(--status-open-pill-border)' },
  { value: 'in-progress', label: 'In Progress', textColor: 'var(--status-in-progress-text)', bgColor: 'var(--status-in-progress-pill-bg)', borderColor: 'var(--status-in-progress-pill-border)' },
  { value: 'complete', label: 'Complete', textColor: 'var(--status-complete-text)', bgColor: 'var(--status-complete-pill-bg)', borderColor: 'var(--status-complete-pill-border)' },
  { value: 'blocked', label: 'Blocked', textColor: 'var(--status-blocked-text)', bgColor: 'var(--status-blocked-pill-bg)', borderColor: 'var(--status-blocked-pill-border)' }
];

@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  imports: [CommonModule, PillComponent, DropdownComponent],
  templateUrl: './work-order-bar.component.html',
  styleUrls: ['./work-order-bar.component.scss']
})
export class WorkOrderBarComponent {
  @Input() order!: WorkOrderDocument;
  @Input() leftPx = 0;
  @Input() widthPx = 100;

  @Output() edit = new EventEmitter<WorkOrderDocument>();
  @Output() delete = new EventEmitter<string>();

  @ViewChild('actionsDropdown') actionsDropdown?: DropdownComponent;

  isHovered = false;

  get config(): StatusConfig {
    return WORK_ORDER_BAR_CONFIG.find(s => s.value === this.order.data.status) || WORK_ORDER_BAR_CONFIG[0];
  }

  get pillConfig(): StatusConfig {
    return STATUS_PILL_CONFIG.find(s => s.value === this.order.data.status) || STATUS_PILL_CONFIG[0];
  }

  onEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.actionsDropdown?.close();
    this.edit.emit(this.order);
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.actionsDropdown?.close();
    this.delete.emit(this.order.docId);
  }

  onMouseLeave(): void {
    // Don't hide if dropdown is open - user may be interacting with the menu
    if (this.actionsDropdown?.isOpen) {
      return;
    }
    this.isHovered = false;
  }

  onDropdownClosed(): void {
    // When dropdown closes, check if we should also unhover
    if (!this.isHovered) {
      return;
    }
  }
}
