import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { WorkOrderService } from '../../services/work-order.service';
import { WorkOrderDocument, WorkOrderStatus, PanelMode, STATUS_CONFIGS } from '../../models/work-order.model';
import { isoToNgbDate, ngbDateToIso, ngbDateToDate, formatNgbDate } from '../../utils/date-conversions';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Slide Panel Component
 *
 * Slides in from the right for creating/editing work orders.
 * Uses Angular Reactive Forms with FormGroup and FormControl.
 * Form field order per design: Work Order Name, Status, End date, Start date.
 */
@Component({
  selector: 'app-slide-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, NgbDatepickerModule],
  templateUrl: './slide-panel.component.html',
  styleUrls: ['./slide-panel.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('250ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class SlidePanelComponent implements OnInit {
  @Input() mode: PanelMode = 'create';
  @Input() workCenterId = '';
  @Input() startDate = '';
  @Input() editingOrder: WorkOrderDocument | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  form!: FormGroup;
  overlapError: string | null = null;

  statusOptions = STATUS_CONFIGS.map(s => ({ value: s.value, label: s.label }));

  readonly formatDate = formatNgbDate;

  constructor(private workOrderService: WorkOrderService) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    if (this.mode === 'edit' && this.editingOrder) {
      const order = this.editingOrder;
      this.form = new FormGroup({
        name: new FormControl(order.data.name, [Validators.required]),
        status: new FormControl(order.data.status, [Validators.required]),
        endDate: new FormControl(isoToNgbDate(order.data.endDate), [Validators.required]),
        startDate: new FormControl(isoToNgbDate(order.data.startDate), [Validators.required])
      }, { validators: this.dateRangeValidator });
    } else {
      const start = this.startDate || new Date().toISOString().split('T')[0];
      const endDate = new Date(start);
      endDate.setDate(endDate.getDate() + 7);
      const end = endDate.toISOString().split('T')[0];

      this.form = new FormGroup({
        name: new FormControl('', [Validators.required]),
        status: new FormControl('open' as WorkOrderStatus, [Validators.required]),
        endDate: new FormControl(isoToNgbDate(end), [Validators.required]),
        startDate: new FormControl(isoToNgbDate(start), [Validators.required])
      }, { validators: this.dateRangeValidator });
    }
  }

  dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {
    const startVal = group.get('startDate')?.value;
    const endVal = group.get('endDate')?.value;

    if (!startVal || !endVal) return null;

    const start = ngbDateToDate(startVal);
    const end = ngbDateToDate(endVal);

    if (end <= start) {
      return { dateRange: 'End date must be after start date.' };
    }
    return null;
  };

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.overlapError = null;

    const formValue = this.form.value;
    const data = {
      name: formValue.name,
      workCenterId: this.workCenterId,
      status: formValue.status as WorkOrderStatus,
      startDate: ngbDateToIso(formValue.startDate),
      endDate: ngbDateToIso(formValue.endDate)
    };

    let error: string | null;

    if (this.mode === 'edit' && this.editingOrder) {
      error = this.workOrderService.updateWorkOrder(this.editingOrder.docId, data);
    } else {
      error = this.workOrderService.createWorkOrder(data);
    }

    if (error) {
      this.overlapError = error;
      return;
    }

    this.saved.emit();
  }

  onCancel(): void {
    this.close.emit();
  }

  get statusClass(): string {
    const val = this.form.get('status')?.value;
    return val ? `status-${val}` : '';
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    }
  }
}
