import { Component, Input, Output, EventEmitter, OnInit, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { WorkOrderService } from '../../services/work-order.service';
import { WorkOrderDocument, WorkOrderStatus, PanelMode } from '../../models/work-order.model';
import { PillComponent } from '../../ui/pill/pill.component';
import { isoToNgbDate, ngbDateToIso, ngbDateToDate, formatNgbDate } from '../../utils/date-conversions';
import { trigger, transition, style, animate } from '@angular/animations';
import { STATUS_PILL_CONFIG } from '../../constants/status-config';

@Component({
  selector: 'app-slide-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, NgbDatepickerModule, PillComponent],
  templateUrl: './slide-panel.component.html',
  styleUrls: ['./slide-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideIn', [
      transition('void => *', [
        style({ transform: 'translateX(100%)' }),
        animate('250ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition('* => void', [
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
  isLeaving = false;

  statusOptions = STATUS_PILL_CONFIG.map(s => ({
    value: s.value,
    label: s.label,
    textColor: s.textColor,
    bgColor: s.bgColor,
    borderColor: s.borderColor
  }));

  readonly formatDate = formatNgbDate;

  constructor(
    private workOrderService: WorkOrderService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    }
  }

  onAnimationDone(event: any): void {
    // After leave animation completes, emit close event
    if (this.isLeaving && event.toState === 'void') {
      this.close.emit();
    }
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

    console.log({ error })

    if (error) {
      this.overlapError = error;
      this.cdr.markForCheck();
      return;
    }

    this.saved.emit();
  }

  onCancel(): void {
    this.isLeaving = true;
    this.cdr.markForCheck();
  }
}
