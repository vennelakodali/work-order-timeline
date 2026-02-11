import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { WorkOrderService } from '../../services/work-order.service';
import { WorkCenterDocument } from '../../models/work-center.model';
import { WorkOrderDocument, PanelMode, TimescaleLevels } from '../../models/work-order.model';
import { WorkOrderBarComponent } from '../work-order-bar/work-order-bar.component';
import { SlidePanelComponent } from '../slide-panel/slide-panel.component';
import { TimelineHeaderComponent } from '../timeline-header/timeline-header.component';
import { generateTimelineColumns, TimelineColumn, TimelineColumnConfig } from '../../utils/timeline-columns';
import { dateToPosition, positionToDate, getBarStyle } from '../../utils/timeline-positioning';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, WorkOrderBarComponent, SlidePanelComponent, TimelineHeaderComponent],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class TimelineComponent implements OnInit, OnDestroy {
  @ViewChild('timelineScroll', { static: false }) timelineScroll!: ElementRef<HTMLDivElement>;

  workCenters: WorkCenterDocument[] = [];
  workOrders: WorkOrderDocument[] = [];

  timescale = TimescaleLevels.month;
  columnConfig!: TimelineColumnConfig;

  panelOpen = false;
  panelMode: PanelMode = 'create';
  panelWorkCenterId = '';
  panelStartDate = '';
  editingOrder: WorkOrderDocument | null = null;

  hoveredRowId: string | null = null;
  todayPosition = 0;

  private subscriptions = new Subscription();
  private today = new Date();

  constructor(private workOrderService: WorkOrderService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.workOrderService.workCenters$.subscribe(centers => {
        this.workCenters = centers;
      })
    );
    this.subscriptions.add(
      this.workOrderService.workOrders$.subscribe(orders => {
        this.workOrders = orders;
        this.recalculateTodayPosition();
      })
    );

    this.regenerateColumns();
    setTimeout(() => this.scrollToToday(), 100);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ---------------------------------------------------------------------------
  // Column & Position Calculations
  // ---------------------------------------------------------------------------

  get columns() { return this.columnConfig.columns; }
  get columnWidth() { return this.columnConfig.columnWidth; }
  get totalTimelineWidth(): number { return this.columns.length * this.columnWidth; }

  regenerateColumns(): void {
    this.columnConfig = generateTimelineColumns(this.timescale);
    this.recalculateTodayPosition();
  }

  private recalculateTodayPosition(): void {
    if (!this.columnConfig) return;
    const todayStr = new Date().toISOString().split('T')[0];
    this.todayPosition = dateToPosition(
      todayStr,
      this.columnConfig.timelineStartDate,
      this.columnConfig.timelineEndDate,
      this.totalTimelineWidth
    );
  }

  getOrdersForCenter(centerId: string): WorkOrderDocument[] {
    return this.workOrders.filter(wo => wo.data.workCenterId === centerId);
  }

  calcBarStyle(order: WorkOrderDocument): { left: number; width: number } {
    return getBarStyle(
      order.data.startDate,
      order.data.endDate,
      this.columnConfig.timelineStartDate,
      this.columnConfig.timelineEndDate,
      this.totalTimelineWidth
    );
  }

  /** Check if a column contains the current period (today) */
  isCurrentPeriod(col: TimelineColumn): boolean {
    return this.today >= col.startDate && this.today < col.endDate;
  }

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------

  onTimelineClick(event: MouseEvent, workCenterId: string): void {
    const target = event.target as HTMLElement;
    if (target.closest('app-work-order-bar') || target.closest('.dropdown-container')) {
      return;
    }

    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const xInRow = event.clientX - rect.left + scrollEl.scrollLeft;
    const clickDate = positionToDate(
      xInRow,
      this.columnConfig.timelineStartDate,
      this.columnConfig.timelineEndDate,
      this.totalTimelineWidth
    );

    this.openCreatePanel(workCenterId, clickDate);
  }

  onTimescaleChange(level: string): void {
    this.timescale = level;
    this.regenerateColumns();
    setTimeout(() => this.scrollToToday(), 50);
  }

  scrollToToday(): void {
    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl) return;
    const viewportWidth = scrollEl.clientWidth;
    scrollEl.scrollLeft = this.todayPosition - viewportWidth / 2;
  }

  onRowHover(centerId: string | null): void {
    this.hoveredRowId = centerId;
  }

  get todayLabel(): string {
    switch (this.timescale) {
      case 'Hour': return 'Now';
      case 'Week': return 'This week';
      case 'Month': return 'This month';
      default: return 'Today';
    }
  }

  // ---------------------------------------------------------------------------
  // Panel Operations
  // ---------------------------------------------------------------------------

  openCreatePanel(workCenterId: string, startDate: string): void {
    this.panelMode = 'create';
    this.panelWorkCenterId = workCenterId;
    this.panelStartDate = startDate;
    this.editingOrder = null;
    this.panelOpen = true;
  }

  openEditPanel(order: WorkOrderDocument): void {
    this.panelMode = 'edit';
    this.panelWorkCenterId = order.data.workCenterId;
    this.panelStartDate = order.data.startDate;
    this.editingOrder = order;
    this.panelOpen = true;
  }

  onPanelClose(): void {
    this.panelOpen = false;
    this.editingOrder = null;
  }

  onPanelSave(): void {
    this.panelOpen = false;
    this.editingOrder = null;
  }

  onDeleteOrder(orderId: string): void {
    this.workOrderService.deleteWorkOrder(orderId);
  }

  onEditOrder(order: WorkOrderDocument): void {
    this.openEditPanel(order);
  }

  // ---------------------------------------------------------------------------
  // Track-by functions
  // ---------------------------------------------------------------------------

  trackByCenter(_index: number, center: WorkCenterDocument): string {
    return center.docId;
  }

  trackByOrder(_index: number, order: WorkOrderDocument): string {
    return order.docId;
  }

  trackByColumn(_index: number, col: TimelineColumn): string {
    return col.label;
  }
}
