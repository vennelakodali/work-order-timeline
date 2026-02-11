import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrderDocument } from '../../models/work-order.model';
import { StatusBadgeComponent } from '../../ui/status-badge/status-badge.component';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';

@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, DropdownComponent],
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

  get statusClass(): string {
    return `status-${this.order.data.status}`;
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
