import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WorkCenterDocument } from '../models/work-center.model';
import { WorkOrderDocument } from '../models/work-order.model';
import { createSampleData } from '../data/sample-data';
import { checkOverlap } from '../utils/overlap-detection';

/**
 * Service managing work centers and work orders.
 * Handles CRUD operations and localStorage persistence.
 */
@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private readonly STORAGE_KEY_CENTERS = 'wo_work_centers';
  private readonly STORAGE_KEY_ORDERS = 'wo_work_orders';

  private workCentersSubject = new BehaviorSubject<WorkCenterDocument[]>([]);
  private workOrdersSubject = new BehaviorSubject<WorkOrderDocument[]>([]);

  public constructor() {
    this.loadFromStorage();
  }

  // ---------------------------------------------------------------------------
  // Initialization & Persistence
  // ---------------------------------------------------------------------------

  private loadFromStorage(): void {
    const storedCenters = localStorage.getItem(this.STORAGE_KEY_CENTERS);
    const storedOrders = localStorage.getItem(this.STORAGE_KEY_ORDERS);

    if (storedCenters && storedOrders) {
      this.workCentersSubject.next(JSON.parse(storedCenters));
      this.workOrdersSubject.next(JSON.parse(storedOrders));
    } else {
      this.initSampleData();
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY_CENTERS, JSON.stringify(this.workCentersSubject.value));
    localStorage.setItem(this.STORAGE_KEY_ORDERS, JSON.stringify(this.workOrdersSubject.value));
  }

  private initSampleData(): void {
    const { centers, orders } = createSampleData();
    this.workCentersSubject.next(centers);
    this.workOrdersSubject.next(orders);
    this.saveToStorage();
  }

  // ---------------------------------------------------------------------------
  // Read Operations
  // ---------------------------------------------------------------------------

  public getWorkCenters$(): Observable<WorkCenterDocument[]> {
    return this.workCentersSubject.asObservable();
  }

  public getWorkOrders$(): Observable<WorkOrderDocument[]> {
    return this.workOrdersSubject.asObservable();
  }

  private getOrdersByWorkCenter(workCenterId: string): WorkOrderDocument[] {
    return this.workOrdersSubject.value.filter(wo => wo.data.workCenterId === workCenterId);
  }

  // ---------------------------------------------------------------------------
  // Write Operations
  // ---------------------------------------------------------------------------

  /**
   * Create a new work order after validating no overlaps exist.
   * @returns error message string if overlap detected, or null on success.
   */
  public createWorkOrder(data: WorkOrderDocument['data']): string | null {
    const existingOrders = this.getOrdersByWorkCenter(data.workCenterId);
    const overlapError = checkOverlap(existingOrders, data.startDate, data.endDate);
    if (overlapError) return overlapError;

    const newOrder: WorkOrderDocument = {
      docId: this.generateId(),
      docType: 'workOrder',
      data: { ...data }
    };

    const orders = [...this.workOrdersSubject.value, newOrder];
    this.workOrdersSubject.next(orders);
    this.saveToStorage();
    return null;
  }

  /**
   * Update an existing work order after validating no overlaps.
   * @returns error message string if overlap detected, or null on success.
   */
  public updateWorkOrder(docId: string, data: WorkOrderDocument['data']): string | null {
    const existingOrders = this.getOrdersByWorkCenter(data.workCenterId);
    const overlapError = checkOverlap(existingOrders, data.startDate, data.endDate, docId);
    if (overlapError) return overlapError;

    const orders = this.workOrdersSubject.value.map(wo =>
      wo.docId === docId ? { ...wo, data: { ...data } } : wo
    );
    this.workOrdersSubject.next(orders);
    this.saveToStorage();
    return null;
  }

  public deleteWorkOrder(docId: string): void {
    const orders = this.workOrdersSubject.value.filter(wo => wo.docId !== docId);
    this.workOrdersSubject.next(orders);
    this.saveToStorage();
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private generateId(): string {
    return 'wo-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
  }
}
