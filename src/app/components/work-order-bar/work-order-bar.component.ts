import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusConfig, WorkOrderDocument } from '../../models/work-order.model';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { PillComponent } from '../../ui/pill/pill.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { WORK_ORDER_BAR_CONFIG, STATUS_PILL_CONFIG } from '../../constants/status-config';

@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  imports: [CommonModule, PillComponent, DropdownComponent, NgbTooltipModule],
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
}
