import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
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
  @ViewChild('hoverButtonTooltip') hoverButtonTooltip!: NgbTooltip;

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
  private readonly HOVER_BUTTON_WIDTH = 113;
  private readonly HOVER_BUTTON_HEIGHT = 38;
  private readonly HOVER_BUTTON_MARGIN = 20;

  private subscriptions = new Subscription();
  private today = new Date();

  constructor(private workOrderService: WorkOrderService) { }

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

  /** Check if a column contains the current period (today) */
  isCurrentPeriod(col: TimelineColumn): boolean {
    return TimelineComponent.checkIfCurrentPeriod(col, this.today);
  }

  private static checkIfCurrentPeriod(col: TimelineColumn, today: Date): boolean {
    return today >= col.startDate && today < col.endDate;
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

    // Convert from row coordinates to timeline coordinates
    const xInTimeline = xInRow - this.workCenterColumnWidth;

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
    setTimeout(() => this.scrollToToday(), 50);
  }

  scrollToToday(): void {
    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl) return;
    const viewportWidth = scrollEl.clientWidth;
    // Account for the sticky work center column when centering
    scrollEl.scrollLeft = this.todayPosition - viewportWidth / 2 - this.workCenterColumnWidth / 2;
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
    if (this.isOverWorkCenterColumn(event)) {
      if (this.hoverButtonPosition) {
        this.clearHoverButton();
      }
      return;
    }

    if (this.hoveredRowId === centerId && this.hoverButtonPosition) {
      // Clear button if cursor moved outside bounds OR if now over a work order bar
      if (this.isCursorOutsideButtonBounds(event) || this.isOverOrderBar(event)) {
        this.clearHoverButton();
      } else {
        // Also check if still over empty space using coordinates
        const scrollEl = this.timelineScroll?.nativeElement;
        if (scrollEl) {
          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
          const xInRow = event.clientX - rect.left;
          const xInRowWithScroll = xInRow + scrollEl.scrollLeft;
          const xInTimeline = xInRowWithScroll - this.workCenterColumnWidth;

          if (!this.isOverEmptySpace(centerId, xInTimeline)) {
            this.clearHoverButton();
          }
        }
      }
    } else if (this.hoveredRowId === centerId && !this.hoverButtonPosition) {
      this.updateHoverButton(event, centerId);
    }
  }

  private updateHoverButton(event: MouseEvent, centerId: string): void {
    if (this.isOverWorkCenterColumn(event) || this.isOverOrderBar(event)) {
      return;
    }

    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const xInRow = event.clientX - rect.left;
    const xInRowWithScroll = xInRow + scrollEl.scrollLeft;

    // Convert from row coordinates to timeline coordinates
    // Row coordinates include the work center column, but bar positions don't
    const xInTimeline = xInRowWithScroll - this.workCenterColumnWidth;

    if (this.isOverEmptySpace(centerId, xInTimeline)) {
      this.showHoverButton(event, rect);
    }
  }

  private isOverWorkCenterColumn(event: MouseEvent): boolean {
    return TimelineComponent.checkIfOverWorkCenterColumn(event, this.workCenterColumnWidth);
  }

  private static checkIfOverWorkCenterColumn(event: MouseEvent, workCenterWidth: number): boolean {
    const target = event.target as HTMLElement;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const xInRow = event.clientX - rect.left;
    return target.closest('.work-center-cell') !== null || xInRow < workCenterWidth;
  }

  private isOverOrderBar(event: MouseEvent): boolean {
    return TimelineComponent.checkIfOverOrderBar(event);
  }

  private static checkIfOverOrderBar(event: MouseEvent): boolean {
    const target = event.target as HTMLElement;
    return target.closest('app-work-order-bar') !== null;
  }

  private isOverEmptySpace(centerId: string, xPosition: number): boolean {
    const orders = this.getOrdersForCenter(centerId);
    const bars = orders.map(order => this.calcBarStyle(order));
    return TimelineComponent.checkIfOverEmptySpace(xPosition, bars);
  }

  private static checkIfOverEmptySpace(
    xPosition: number,
    bars: Array<{ left: number; width: number }>
  ): boolean {
    return !bars.some(bar => xPosition >= bar.left && xPosition <= (bar.left + bar.width));
  }

  private isCursorOutsideButtonBounds(event: MouseEvent): boolean {
    if (!this.hoverButtonPosition) return true;

    return TimelineComponent.checkIfCursorOutsideButtonBounds(
      event,
      this.hoverButtonPosition,
      this.HOVER_BUTTON_WIDTH,
      this.HOVER_BUTTON_HEIGHT,
      this.HOVER_BUTTON_MARGIN
    );
  }

  private static checkIfCursorOutsideButtonBounds(
    event: MouseEvent,
    buttonPosition: { x: number; y: number },
    buttonWidth: number,
    buttonHeight: number,
    margin: number
  ): boolean {
    const distanceX = Math.abs(event.clientX - buttonPosition.x);
    const distanceY = Math.abs(event.clientY - buttonPosition.y);

    return distanceX > (buttonWidth / 2 + margin) || distanceY > (buttonHeight / 2 + margin);
  }

  private showHoverButton(event: MouseEvent, rowRect: DOMRect): void {
    this.hoverButtonPosition = {
      x: event.clientX,
      y: rowRect.top + (rowRect.height / 2)
    };
    setTimeout(() => this.hoverButtonTooltip?.open(), 0);
  }

  private clearHoverButton(): void {
    this.hoverButtonPosition = null;
    this.hoverButtonTooltip?.close();
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
