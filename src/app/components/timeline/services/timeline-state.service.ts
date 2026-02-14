import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WorkOrderDocument } from '../../../models/work-order.model';

export type TimelinePanelState = {
  isOpen: boolean;
  workCenterId: string;
  startDate: string;
  editingOrder: WorkOrderDocument | null;
}

/**
 * Service managing timeline UI state.
 * Handles hover state and panel state.
 */
@Injectable({ providedIn: 'root' })
export class TimelineStateService {
  private hoveredRowIdSubject = new BehaviorSubject<string | null>(null);
  private hoveredWorkCenterIdSubject = new BehaviorSubject<string | null>(null);
  private hoverButtonPositionSubject = new BehaviorSubject<{ x: number; y: number } | null>(null);

  private panelStateSubject = new BehaviorSubject<TimelinePanelState>({
    isOpen: false,
    workCenterId: '',
    startDate: '',
    editingOrder: null
  });

  public readonly hoveredRowId$: Observable<string | null> = this.hoveredRowIdSubject.asObservable();
  public readonly hoverButtonPosition$: Observable<{ x: number; y: number } | null> = this.hoverButtonPositionSubject.asObservable();
  public readonly panelState$: Observable<TimelinePanelState> = this.panelStateSubject.asObservable();


  public setHoverState(rowId: string, workCenterId: string, position: { x: number; y: number } | null): void {
    this.hoveredRowIdSubject.next(rowId);
    this.hoveredWorkCenterIdSubject.next(workCenterId);
    this.hoverButtonPositionSubject.next(position);
  }

  public clearHoverState(): void {
    this.hoveredRowIdSubject.next(null);
    this.hoveredWorkCenterIdSubject.next(null);
    this.hoverButtonPositionSubject.next(null);
  }

  public updateButtonPosition(position: { x: number; y: number } | null): void {
    this.hoverButtonPositionSubject.next(position);
  }

  public get currentHoverState() {
    return {
      rowId: this.hoveredRowIdSubject.value,
      workCenterId: this.hoveredWorkCenterIdSubject.value,
      buttonPosition: this.hoverButtonPositionSubject.value
    };
  }

  public openPanel(workCenterId: string, startDate: string, order: WorkOrderDocument | null): void {
    this.panelStateSubject.next({
      isOpen: true,
      workCenterId,
      startDate,
      editingOrder: order
    });
  }

  public closePanel(): void {
    this.panelStateSubject.next({
      isOpen: false,
      workCenterId: '',
      startDate: '',
      editingOrder: null
    });
  }

}
