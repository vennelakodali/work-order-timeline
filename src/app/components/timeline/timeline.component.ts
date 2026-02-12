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
  hoveredRowHasNoOrders = false;
  hoverButtonPosition: { x: number; y: number } | null = null;
  todayPosition = 0;
  clickToAddCoords: {
    [key: string]: string
  } | null = null;
  readonly workCenterColumnWidth = 380; // Matches --panel-width in styles.scss

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
  get totalTableWidth(): number { return this.workCenterColumnWidth + this.totalTimelineWidth; }

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
    // Account for the sticky work center column when centering
    scrollEl.scrollLeft = this.todayPosition - viewportWidth / 2 - this.workCenterColumnWidth / 2;
  }

  onRowHover(event: MouseEvent | null, centerId: string | null): void {
    this.hoveredRowId = centerId;

    if (event && centerId) {
      this.updateHoverButton(event, centerId);
    } else {
      this.hoveredRowHasNoOrders = false;
      this.hoverButtonPosition = null;
      this.hoverButtonTooltip?.close();
    }
  }

  onRowMouseMove(event: MouseEvent, centerId: string): void {
    // Check if cursor is over the work center column
    const target = event.target as HTMLElement;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const xInRow = event.clientX - rect.left;
    const isOverWorkCenterColumn = target.closest('.work-center-cell') !== null || xInRow < this.workCenterColumnWidth;

    if (isOverWorkCenterColumn) {
      // Hide button if over work center column
      if (this.hoverButtonPosition) {
        this.hoverButtonPosition = null;
        this.hoveredRowHasNoOrders = false;
        this.hoverButtonTooltip?.close();
      }
      return;
    }

    if (this.hoveredRowId === centerId && this.hoverButtonPosition) {
      // Check if cursor is still near the button area
      const buttonWidth = 100; // Approximate button width
      const buttonHeight = 32; // Approximate button height
      const margin = 20; // Extra margin for tolerance

      const distanceX = Math.abs(event.clientX - this.hoverButtonPosition.x);
      const distanceY = Math.abs(event.clientY - this.hoverButtonPosition.y);

      // Hide button if cursor moves outside the button bounds
      if (distanceX > (buttonWidth / 2 + margin) || distanceY > (buttonHeight / 2 + margin)) {
        this.hoverButtonPosition = null;
        this.hoveredRowHasNoOrders = false;
        this.hoverButtonTooltip?.close();
      }
    } else if (this.hoveredRowId === centerId && !this.hoverButtonPosition) {
      // Show button if we don't have one yet
      this.updateHoverButton(event, centerId);
    }
  }

  private updateHoverButton(event: MouseEvent, centerId: string): void {
    // Check if cursor is over the work center column (first column)
    const target = event.target as HTMLElement;
    const isOverWorkCenterColumn = target.closest('.work-center-cell') !== null;

    if (isOverWorkCenterColumn) {
      return; // Don't show button over work center column
    }

    // Calculate the mouse position relative to the timeline
    const scrollEl = this.timelineScroll?.nativeElement;
    if (!scrollEl) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const xInRow = event.clientX - rect.left;

    // Also check X position - if it's within the work center column width, don't show button
    if (xInRow < this.workCenterColumnWidth) {
      return; // Don't show button over work center column area
    }

    // Check if cursor is over an existing work order bar
    const isOverOrderBar = target.closest('app-work-order-bar') !== null;

    if (isOverOrderBar) {
      return; // Don't show button over orders
    }

    const xInRowWithScroll = xInRow + scrollEl.scrollLeft;

    // Check if this position overlaps with any order bar for this work center
    const orders = this.getOrdersForCenter(centerId);
    const isOverEmptySpace = !orders.some(order => {
      const barStyle = this.calcBarStyle(order);
      return xInRowWithScroll >= barStyle.left && xInRowWithScroll <= (barStyle.left + barStyle.width);
    });

    if (isOverEmptySpace) {
      // Show button at cursor X position, but vertically centered on the row
      const rowRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.hoveredRowHasNoOrders = true;
      this.hoverButtonPosition = {
        x: event.clientX,
        y: rowRect.top + (rowRect.height / 2) // Center of the row
      };
      // Open tooltip when button appears
      setTimeout(() => this.hoverButtonTooltip?.open(), 0);
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
