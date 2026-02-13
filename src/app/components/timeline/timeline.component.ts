import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { WorkOrderService } from '../../services/work-order.service';
import { WorkCenterDocument } from '../../models/work-center.model';
import { WorkOrderDocument, PanelMode, TimescaleLevels } from '../../models/work-order.model';
import { WorkOrderBarComponent } from '../work-order-bar/work-order-bar.component';
import { SlidePanelComponent } from '../slide-panel/slide-panel.component';
import { TimelineHeaderComponent } from '../timeline-header/timeline-header.component';
import { TimelineHoverButtonComponent } from './timeline-hover-button.component';
import { PillComponent } from '../../ui/pill/pill.component';
import { generateTimelineColumns, TimelineColumn, TimelineColumnConfig } from '../../utils/timeline-columns';
import { dateToPosition, positionToDate, getBarStyle } from '../../utils/timeline-positioning';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, WorkOrderBarComponent, SlidePanelComponent, TimelineHeaderComponent, TimelineHoverButtonComponent, PillComponent],
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
  hoverButtonPosition: { x: number; y: number } | null = null;
  hoveredWorkCenterId: string | null = null;
  todayPosition = 0;

  readonly workCenterColumnWidth = 380; // Matches --panel-width in styles.scss

  private destroy$ = new Subject<void>();
  private today = new Date();

  private readonly hoverButtonBounds = { width: 113, height: 38, margin: 20 };

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

    const xInTimeline = this.clientXToTimelineX(event.clientX, scrollEl);
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

  // ---------------------------------------------------------------------------
  // Hover Button Orchestration
  // ---------------------------------------------------------------------------

  onRowHover(event: MouseEvent, centerId: string): void {
    this.hoveredRowId = centerId;
    this.hoveredWorkCenterId = centerId;
    this.updateHoverButtonPosition(event, centerId);
  }

  onRowMouseLeave(event: MouseEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest('app-timeline-hover-button')) {
      return;
    }
    this.clearHoverState();
  }

  onHoverButtonLeave(event: MouseEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest('.timeline-row')) {
      return;
    }
    this.clearHoverState();
  }

  private clearHoverState(): void {
    this.hoveredRowId = null;
    this.hoveredWorkCenterId = null;
    this.hoverButtonPosition = null;
  }

  onRowMouseMove(event: MouseEvent, centerId: string): void {
    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl || this.hoveredRowId !== centerId) return;

    // If button exists and cursor is near it, don't hide it
    if (this.hoverButtonPosition) {
      if (!this.isCursorOutsideButtonBounds(event, this.hoverButtonPosition)) {
        return;
      }
    }

    // Check if we should show or hide the button
    const shouldShow = this.shouldShowHoverButton(event, centerId, scrollEl);

    if (shouldShow) {
      this.updateHoverButtonPosition(event, centerId);
    } else {
      this.hoverButtonPosition = null;
    }
  }

  onHoverButtonClick(position: { x: number; y: number }): void {
    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl || !this.hoveredWorkCenterId) return;

    const xInTimeline = this.clientXToTimelineX(position.x, scrollEl);
    const clickDate = positionToDate(
      xInTimeline,
      this.columnConfig.timelineStartDate,
      this.columnConfig.timelineEndDate,
      this.totalTimelineWidth
    );

    this.openCreatePanel(this.hoveredWorkCenterId, clickDate);
    this.hoverButtonPosition = null;
  }

  private shouldShowHoverButton(event: MouseEvent, centerId: string, scrollEl: HTMLDivElement): boolean {
    if (this.isOverWorkCenterColumn(event)) {
      return false;
    }

    if (this.isOverOrderBar(event)) {
      return false;
    }

    const xInTimeline = this.clientXToTimelineX(event.clientX, scrollEl);
    const orders = this.getOrdersForCenter(centerId);
    const bars = orders.map(order => this.calcBarStyle(order));

    return this.isOverEmptySpace(xInTimeline, bars);
  }

  private updateHoverButtonPosition(event: MouseEvent, centerId: string): void {
    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl) return;

    if (this.shouldShowHoverButton(event, centerId, scrollEl)) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.hoverButtonPosition = {
        x: event.clientX,
        y: rect.top + rect.height / 2
      };
    } else {
      this.hoverButtonPosition = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Hover Detection Helpers (inlined from service — no shared state needed)
  // ---------------------------------------------------------------------------

  private isOverWorkCenterColumn(event: MouseEvent): boolean {
    const target = event.target as HTMLElement;
    if (target.closest('.work-center-cell') !== null) {
      return true;
    }
    // On mouseenter, target is the <tr> so the DOM check above fails.
    // Use the scroll wrapper rect which is stable regardless of scroll position.
    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl) return false;
    const scrollRect = scrollEl.getBoundingClientRect();
    return event.clientX < scrollRect.left + this.workCenterColumnWidth;
  }

  private isOverOrderBar(event: MouseEvent): boolean {
    const target = event.target as HTMLElement;
    return target.closest('app-work-order-bar') !== null ||
           target.closest('.work-order-bar') !== null;
  }

  private isOverEmptySpace(xPosition: number, bars: Array<{ left: number; width: number }>): boolean {
    return !bars.some(bar => xPosition >= bar.left && xPosition <= bar.left + bar.width);
  }

  private isCursorOutsideButtonBounds(event: MouseEvent, buttonPosition: { x: number; y: number }): boolean {
    const distanceX = Math.abs(event.clientX - buttonPosition.x);
    const distanceY = Math.abs(event.clientY - buttonPosition.y);
    return distanceX > (this.hoverButtonBounds.width / 2 + this.hoverButtonBounds.margin) ||
           distanceY > (this.hoverButtonBounds.height / 2 + this.hoverButtonBounds.margin);
  }

  private clientXToTimelineX(clientX: number, scrollEl: HTMLDivElement): number {
    const scrollRect = scrollEl.getBoundingClientRect();
    return clientX - scrollRect.left - this.workCenterColumnWidth + scrollEl.scrollLeft;
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
