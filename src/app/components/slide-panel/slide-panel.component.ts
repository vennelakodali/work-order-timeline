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
  @Input() public workCenterId = '';
  @Input(({ required: true })) public startDate!: string;
  @Input() public editingOrder: WorkOrderDocument | null = null;

  @Output() public close = new EventEmitter<void>();
  @Output() public saved = new EventEmitter<void>();

  public form!: FormGroup;
  public overlapError: string | null = null;
  public isLeaving = false;

  public statusOptions = STATUS_PILL_CONFIG.map(s => ({
    value: s.value,
    label: s.label,
    textColor: s.textColor,
    bgColor: s.bgColor,
    borderColor: s.borderColor
  }));

  public readonly formatDate = formatNgbDate;

  constructor(
    private workOrderService: WorkOrderService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.initForm();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    }
  }

  public onAnimationDone(event: any): void {
    // After leave animation completes, emit close event
    if (this.isLeaving && event.toState === 'void') {
      this.close.emit();
    }
  }

  private initForm(): void {
    const startRaw = this.editingOrder ? this.editingOrder?.data.startDate : (this.startDate || new Date().toISOString().split('T')[0]);
    const endRaw = this.editingOrder ? this.editingOrder?.data.endDate : this.addDays(startRaw, 7);

    this.form = new FormGroup({
      name: new FormControl(this.editingOrder ? this.editingOrder.data.name : '', [Validators.required]),
      status: new FormControl(this.editingOrder ? this.editingOrder.data.status : 'open', [Validators.required]),
      startDate: new FormControl(isoToNgbDate(startRaw), [Validators.required]),
      endDate: new FormControl(isoToNgbDate(endRaw), [Validators.required])
    }, { validators: this.dateRangeValidator });
  }

  public dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {
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

  public onSubmit(): void {
    this.form.markAsTouched();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.value;
    const data = {
      name: formValue.name,
      workCenterId: this.workCenterId,
      status: formValue.status as WorkOrderStatus,
      startDate: ngbDateToIso(formValue.startDate),
      endDate: ngbDateToIso(formValue.endDate)
    };

    let error: string | null;

    if (this.editingOrder) {
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

  public onCancel(): void {
    this.isLeaving = true;
    this.cdr.markForCheck();
  }

  private addDays(isoDate: string, days: number): string {
    const date = new Date(isoDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}
