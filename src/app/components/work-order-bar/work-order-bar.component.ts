import { Component, Input, Output, EventEmitter, ViewChild, ChangeDetectionStrategy } from '@angular/core';
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
  styleUrls: ['./work-order-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkOrderBarComponent {
  @Input() public order!: WorkOrderDocument;
  @Input() public leftPx = 0;
  @Input() public widthPx = 100;

  @Output() public edit = new EventEmitter<WorkOrderDocument>();
  @Output() public delete = new EventEmitter<string>();

  @ViewChild('actionsDropdown') public actionsDropdown?: DropdownComponent;

  public get config(): StatusConfig {
    return WORK_ORDER_BAR_CONFIG.find(s => s.value === this.order.data.status) || WORK_ORDER_BAR_CONFIG[0];
  }

  public get pillConfig(): StatusConfig {
    return STATUS_PILL_CONFIG.find(s => s.value === this.order.data.status) || STATUS_PILL_CONFIG[0];
  }

  public onEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.actionsDropdown?.close();
    this.edit.emit(this.order);
  }

  public onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.actionsDropdown?.close();
    this.delete.emit(this.order.docId);
  }
}
