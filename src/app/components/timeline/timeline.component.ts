import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, Observable } from 'rxjs';
import { WorkOrderService } from '../../services/work-order.service';
import { TimelineCalculationService } from './services/timeline-calculation.service';
import { TimelineStateService, TimelinePanelState } from './services/timeline-state.service';
import {
  isValidHoverButtonPosition,
  clientXToTimelineX,
  isCursorOutsideButtonBounds,
  calculateButtonPosition
} from './utils/timeline-hover.utils';
import { WorkCenterDocument } from '../../models/work-center.model';
import { WorkOrderDocument, TimescaleLevels } from '../../models/work-order.model';
import { WorkOrderBarComponent } from '../work-order-bar/work-order-bar.component';
import { SlidePanelComponent } from '../slide-panel/slide-panel.component';
import { TimelineHeaderComponent } from '../timeline-header/timeline-header.component';
import { TimelineHoverButtonComponent } from './timeline-hover-button.component';
import { PillComponent } from '../../ui/pill/pill.component';
import { TimelineColumn, TimelineColumnConfig } from './utils/timeline-columns';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, WorkOrderBarComponent, SlidePanelComponent, TimelineHeaderComponent, TimelineHoverButtonComponent, PillComponent],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  @ViewChild('timelineScroll', { static: false }) public timelineScroll!: ElementRef<HTMLDivElement>;
  @ViewChild(SlidePanelComponent) public slidePanel?: SlidePanelComponent;

  public workCenters: WorkCenterDocument[] = [];
  public workOrders: WorkOrderDocument[] = [];

  public timescale = TimescaleLevels.month;
  public columnConfig!: TimelineColumnConfig;
  public todayPosition = 0;

  public hoveredRowId$!: Observable<string | null>;
  public hoverButtonPosition$!: Observable<{ x: number; y: number } | null>;
  public panelState$!: Observable<TimelinePanelState>;

  private hoveredWorkCenterId: string | null = null;

  private readonly hoverButtonBounds = { width: 113, height: 38, margin: 20 }; // matches the hover button's styles
  private readonly workCenterColumnWidth = 380; // Matches --panel-width in styles.scss

  private destroy$ = new Subject<void>();
  private today = new Date();

  constructor(
    private workOrderService: WorkOrderService,
    private timelineCalc: TimelineCalculationService,
    private timelineState: TimelineStateService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.hoveredRowId$ = this.timelineState.hoveredRowId$;
    this.hoverButtonPosition$ = this.timelineState.hoverButtonPosition$;
    this.panelState$ = this.timelineState.panelState$;

    this.workOrderService.getWorkCenters$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(centers => {
        this.workCenters = centers;
        this.cdr.markForCheck();
      });

    this.workOrderService.getWorkOrders$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(orders => {
        this.workOrders = orders;
        this.recalculateTodayPosition();
        this.cdr.markForCheck();
      });

    this.regenerateColumns();
    this.deferredScrollToToday();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------------------------------------------------------------------------
  // Column & Position Calculations
  // ---------------------------------------------------------------------------

  public get columns() { return this.columnConfig.columns; }
  public get columnWidth() { return this.columnConfig.columnWidth; }
  public get totalTimelineWidth(): number { return this.columns.length * this.columnWidth; }

  public regenerateColumns(): void {
    this.columnConfig = this.timelineCalc.generateColumns(this.timescale);
    this.recalculateTodayPosition();
  }

  private recalculateTodayPosition(): void {
    if (!this.columnConfig) return;
    this.todayPosition = this.timelineCalc.calculateTodayPosition(
      this.columnConfig,
      this.totalTimelineWidth,
      this.workCenterColumnWidth
    );
  }

  public getOrdersForCenter(centerId: string): WorkOrderDocument[] {
    return this.workOrders.filter(wo => wo.data.workCenterId === centerId);
  }

  public getOrderBarStyle(order: WorkOrderDocument): { left: number; width: number } {
    return this.timelineCalc.calculateBarStyle(order, this.columnConfig, this.totalTimelineWidth);
  }

  public isCurrentPeriod(col: TimelineColumn): boolean {
    return this.timelineCalc.isDateInRange(this.today, col.startDate, col.endDate);
  }

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------

  public onTimescaleChange(level: string): void {
    this.timescale = level;
    this.regenerateColumns();
    this.deferredScrollToToday();
  }

  public scrollToToday(): void {
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

  public onRowHover(event: MouseEvent, centerId: string): void {
    this.hoveredWorkCenterId = centerId;
    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl) return;

    if (this.shouldShowHoverButton(event, centerId, scrollEl)) {
      this.setHoverButtonPosition(event, centerId);
    }
  }

  public onRowMouseLeave(event: MouseEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest('app-timeline-hover-button')) {
      return;
    }
    this.timelineState.clearHoverState();
  }

  public onHoverButtonLeave(event: MouseEvent): void {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest('.timeline-row')) {
      return;
    }
    this.timelineState.clearHoverState();
  }

  public onRowMouseMove(event: MouseEvent, centerId: string): void {
    const scrollEl = this.timelineScroll?.nativeElement;
    const currentHoverState = this.timelineState.currentHoverState;
    if (!scrollEl || currentHoverState.rowId !== centerId) return;

    // If button exists and cursor is near it, don't hide it
    if (currentHoverState.buttonPosition) {
      const isOutsideBounds = isCursorOutsideButtonBounds(
        event.clientX,
        event.clientY,
        currentHoverState.buttonPosition,
        this.hoverButtonBounds
      );
      if (!isOutsideBounds) {
        return;
      }
    }

    // Check if we should show or hide the button
    if (this.shouldShowHoverButton(event, centerId, scrollEl)) {
      this.setHoverButtonPosition(event, centerId);
    } else {
      this.timelineState.updateButtonPosition(null);
    }
  }

  private setHoverButtonPosition(event: MouseEvent, centerId: string): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const position = calculateButtonPosition(event, rect);
    this.timelineState.setHoverState(centerId, centerId, position);
  }

  public onHoverButtonClick(position: { x: number; y: number }): void {
    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl || !this.hoveredWorkCenterId) return;

    const scrollRect = scrollEl.getBoundingClientRect();
    const xInTimeline = clientXToTimelineX(
      position.x,
      scrollRect,
      this.workCenterColumnWidth,
      scrollEl.scrollLeft
    );
    const clickDate = this.timelineCalc.positionToDate(
      xInTimeline,
      this.columnConfig,
      this.totalTimelineWidth
    );

    this.timelineState.openPanel(this.hoveredWorkCenterId, clickDate, null);
    this.timelineState.updateButtonPosition(null);
  }

  private shouldShowHoverButton(event: MouseEvent, centerId: string, scrollEl: HTMLDivElement): boolean {
    const isOverWorkCenter = this.isOverWorkCenterColumn(event);
    const isOverBar = this.isOverOrderBar(event);

    const scrollRect = scrollEl.getBoundingClientRect();
    const xInTimeline = clientXToTimelineX(
      event.clientX,
      scrollRect,
      this.workCenterColumnWidth,
      scrollEl.scrollLeft
    );
    const orders = this.getOrdersForCenter(centerId);
    const bars = orders.map(order => this.getOrderBarStyle(order));

    return isValidHoverButtonPosition(isOverWorkCenter, isOverBar, xInTimeline, bars);
  }

  // ---------------------------------------------------------------------------
  // Hover Detection Helpers
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

  // ---------------------------------------------------------------------------
  // Panel Operations
  // ---------------------------------------------------------------------------

  public onPanelClose(): void {
    // Trigger slide panel's close animation, which will emit close event
    this.slidePanel?.onCancel();
  }

  // Called after slide panel animation completes
  public onPanelCloseComplete(): void {
    this.timelineState.closePanel();
  }

  public onPanelSave(): void {
    this.timelineState.closePanel();
  }

  public openEditPanel(order: WorkOrderDocument): void {
    this.timelineState.openPanel(order.data.workCenterId, order.data.startDate, order);
  }

  public onDeleteOrder(orderId: string): void {
    this.workOrderService.deleteWorkOrder(orderId);
  }

  // ---------------------------------------------------------------------------
  // Track-by functions
  // ---------------------------------------------------------------------------

  public trackByCenter = (_: number, center: WorkCenterDocument) => center.docId;
  public trackByOrder = (_: number, order: WorkOrderDocument) => order.docId;
  public trackByColumn = (_: number, col: TimelineColumn) => col.label;
}
