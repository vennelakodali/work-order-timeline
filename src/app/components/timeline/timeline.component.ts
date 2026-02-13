import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import type { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { WorkOrderService } from '../../services/work-order.service';
import { WorkCenterDocument } from '../../models/work-center.model';
import { WorkOrderDocument, PanelMode, TimescaleLevels } from '../../models/work-order.model';
import { WorkOrderBarComponent } from '../work-order-bar/work-order-bar.component';
import { SlidePanelComponent } from '../slide-panel/slide-panel.component';
import { TimelineHeaderComponent } from '../timeline-header/timeline-header.component';
import { PillComponent } from '../../ui/pill/pill.component';
import { generateTimelineColumns, TimelineColumn, TimelineColumnConfig } from '../../utils/timeline-columns';
import { dateToPosition, positionToDate, getBarStyle } from '../../utils/timeline-positioning';
import { trigger, transition, style, animate } from '@angular/animations';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, WorkOrderBarComponent, SlidePanelComponent, TimelineHeaderComponent, PillComponent, NgbTooltipModule],
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
  @ViewChild('hoverButtonTooltip') hoverButtonTooltip?: NgbTooltip;

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
  hoverButtonPosition: { x: number; y: number } | null = null;
  todayPosition = 0;

  readonly workCenterColumnWidth = 380; // Matches --panel-width in styles.scss

  private destroy$ = new Subject<void>();
  private today = new Date();

  constructor(private workOrderService: WorkOrderService) { }

  ngOnInit(): void {
    this.workOrderService.workCenters$
      .pipe(takeUntil(this.destroy$))
      .subscribe(centers => this.workCenters = centers);

    this.workOrderService.workOrders$
      .pipe(takeUntil(this.destroy$))
      .subscribe(orders => {
        this.workOrders = orders;
        this.recalculateTodayPosition();
      });

    this.regenerateColumns();
    this.deferredScrollToToday();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.todayPosition = this.workCenterColumnWidth + dateToPosition(
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

  isCurrentPeriod(col: TimelineColumn): boolean {
    return this.today >= col.startDate && this.today < col.endDate;
  }

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------

  onTimelineClick(event: MouseEvent, workCenterId: string): void {
    if ((event.target as HTMLElement).closest('app-work-order-bar, .dropdown-container')) {
      return;
    }

    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const xInTimeline = event.clientX - rect.left + scrollEl.scrollLeft - this.workCenterColumnWidth;
    const clickDate = positionToDate(
      xInTimeline,
      this.columnConfig.timelineStartDate,
      this.columnConfig.timelineEndDate,
      this.totalTimelineWidth
    );

    this.openCreatePanel(workCenterId, clickDate);
  }

  onTimescaleChange(level: string): void {
    this.timescale = level;
    this.regenerateColumns();
    this.deferredScrollToToday();
  }

  scrollToToday(): void {
    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl) return;
    const viewportWidth = scrollEl.clientWidth;
    scrollEl.scrollLeft = this.todayPosition - viewportWidth / 2 - this.workCenterColumnWidth / 2;
  }

  private deferredScrollToToday(): void {
    setTimeout(() => this.scrollToToday(), 100);
  }

  onRowHover(event: MouseEvent | null, centerId: string | null): void {
    this.hoveredRowId = centerId;
    if (event && centerId) {
      this.updateHoverButton(event, centerId);
    } else {
      this.clearHoverButton();
    }
  }

  onRowMouseMove(event: MouseEvent, centerId: string): void {
    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl || this.hoveredRowId !== centerId) return;

    if (this.hoverButtonPosition) {
      const shouldClear = !this.isOverEmptySpace(event, centerId, scrollEl);
      if (shouldClear) this.clearHoverButton();
    } else {
      this.updateHoverButton(event, centerId);
    }
  }

  private updateHoverButton(event: MouseEvent, centerId: string): void {
    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl) return;

    if (this.isOverEmptySpace(event, centerId, scrollEl)) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.hoverButtonPosition = {
        x: event.clientX,
        y: rect.top + rect.height / 2
      };
      setTimeout(() => this.hoverButtonTooltip?.open(), 0);
    }
  }

  private clearHoverButton(): void {
    this.hoverButtonPosition = null;
    this.hoverButtonTooltip?.close();
  }

  private isOverEmptySpace(event: MouseEvent, centerId: string, scrollEl: HTMLDivElement): boolean {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const xInTimeline = event.clientX - rect.left + scrollEl.scrollLeft - this.workCenterColumnWidth;
    const orders = this.getOrdersForCenter(centerId);
    const bars = orders.map(order => this.calcBarStyle(order));
    return !bars.some(bar => xInTimeline >= bar.left && xInTimeline <= bar.left + bar.width);
  }


  // ---------------------------------------------------------------------------
  // Panel Operations
  // ---------------------------------------------------------------------------

  openCreatePanel(workCenterId: string, startDate: string): void {
    this.openPanel('create', workCenterId, startDate, null);
  }

  openEditPanel(order: WorkOrderDocument): void {
    this.openPanel('edit', order.data.workCenterId, order.data.startDate, order);
  }

  onPanelClose(): void {
    this.closePanel();
  }

  onPanelSave(): void {
    this.closePanel();
  }

  private openPanel(mode: PanelMode, workCenterId: string, startDate: string, order: WorkOrderDocument | null): void {
    this.panelMode = mode;
    this.panelWorkCenterId = workCenterId;
    this.panelStartDate = startDate;
    this.editingOrder = order;
    this.panelOpen = true;
  }

  private closePanel(): void {
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

  trackByCenter = (_: number, center: WorkCenterDocument) => center.docId;
  trackByOrder = (_: number, order: WorkOrderDocument) => order.docId;
  trackByColumn = (_: number, col: TimelineColumn) => col.label;
}
