import { TestBed } from '@angular/core/testing';
import { WorkOrderService } from './work-order.service';
import { WorkOrderDocument } from '../models/work-order.model';
import { take } from 'rxjs';

describe('WorkOrderService', () => {
  let service: WorkOrderService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkOrderService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load sample data on first initialization', (done) => {
      service.getWorkCenters$().subscribe(centers => {
        expect(centers.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should load data from localStorage if available', (done) => {
      const mockCenters = [
        { docId: 'wc-1', docType: 'workCenter' as const, data: { name: 'Test Center' } }
      ];
      const mockOrders: WorkOrderDocument[] = [
        {
          docId: 'wo-1',
          docType: 'workOrder' as const,
          data: {
            name: 'Test Order',
            workCenterId: 'wc-1',
            status: 'open',
            startDate: '2025-01-01',
            endDate: '2025-01-05'
          }
        }
      ];

      localStorage.setItem('wo_work_centers', JSON.stringify(mockCenters));
      localStorage.setItem('wo_work_orders', JSON.stringify(mockOrders));

      const newService = new WorkOrderService();

      newService.getWorkCenters$().subscribe(centers => {
        expect(centers).toEqual(mockCenters);
      });

      newService.getWorkOrders$().subscribe(orders => {
        expect(orders).toEqual(mockOrders);
        done();
      });
    });
  });

  describe('Create Work Order', () => {
    it('should create a new work order successfully', (done) => {
      service.getWorkCenters$().subscribe(centers => {
        if (centers.length > 0) {
          const result = service.createWorkOrder({
            name: 'New Order',
            workCenterId: centers[0].docId,
            status: 'open',
            startDate: '2030-01-01',
            endDate: '2030-01-05'
          });

          expect(result).toBeNull();

          service.getWorkOrders$().subscribe(orders => {
            const newOrder = orders.find(o => o.data.name === 'New Order');
            expect(newOrder).toBeDefined();
            expect(newOrder?.data.status).toBe('open');
            done();
          });
        }
      });
    });

    it('should prevent overlapping work orders', (done) => {
      service.getWorkCenters$().subscribe(centers => {
        if (centers.length > 0) {
          // Create first order
          service.createWorkOrder({
            name: 'Order 1',
            workCenterId: centers[0].docId,
            status: 'open',
            startDate: '2030-01-01',
            endDate: '2030-01-10'
          });

          // Try to create overlapping order
          const result = service.createWorkOrder({
            name: 'Order 2',
            workCenterId: centers[0].docId,
            status: 'open',
            startDate: '2030-01-05',
            endDate: '2030-01-15'
          });

          expect(result).not.toBeNull();
          expect(result).toContain('Overlap detected');
          done();
        }
      });
    });

    it('should allow non-overlapping adjacent work orders', (done) => {
      service.getWorkCenters$().subscribe(centers => {
        if (centers.length > 0) {
          // Create first order
          service.createWorkOrder({
            name: 'Order 1',
            workCenterId: centers[0].docId,
            status: 'open',
            startDate: '2030-01-01',
            endDate: '2030-01-10'
          });

          // Create adjacent order (starts when first one ends)
          const result = service.createWorkOrder({
            name: 'Order 2',
            workCenterId: centers[0].docId,
            status: 'open',
            startDate: '2030-01-10',
            endDate: '2030-01-20'
          });

          expect(result).toBeNull();
          done();
        }
      });
    });
  });

  describe('Update Work Order', () => {
    it('should update an existing work order', (done) => {
      service.getWorkOrders$().pipe(take(1)).subscribe(orders => {
        if (orders.length > 0) {
          const order = orders[0];
          const result = service.updateWorkOrder(order.docId, {
            ...order.data,
            name: 'Updated Name'
          });

          expect(result).toBeNull();

          service.getWorkOrders$().pipe(take(1)).subscribe(updatedOrders => {
            const updated = updatedOrders.find(o => o.docId === order.docId);
            expect(updated?.data.name).toBe('Updated Name');
            done();
          });
        }
      });
    });

    it('should prevent updating to overlapping dates', (done) => {
      service.getWorkCenters$().pipe(take(1)).subscribe(centers => {
        if (centers.length > 0) {
          const workCenterId = centers[0].docId;

          // Create two orders
          service.createWorkOrder({
            name: 'Order 1',
            workCenterId,
            status: 'open',
            startDate: '2030-01-01',
            endDate: '2030-01-10'
          });

          service.createWorkOrder({
            name: 'Order 2',
            workCenterId,
            status: 'open',
            startDate: '2030-01-15',
            endDate: '2030-01-25'
          });

          service.getWorkOrders$().pipe(take(1)).subscribe(orders => {
            const order2 = orders.find(o => o.data.name === 'Order 2');
            if (order2) {
              // Try to update Order 2 to overlap with Order 1
              const result = service.updateWorkOrder(order2.docId, {
                ...order2.data,
                startDate: '2030-01-05',
                endDate: '2030-01-20'
              });

              expect(result).not.toBeNull();
              expect(result).toContain('Overlap detected');
              done();
            }
          });
        }
      });
    });
  });

  describe('Delete Work Order', () => {
    it('should delete a work order', (done) => {
      service.getWorkOrders$().pipe(take(1)).subscribe(orders => {
        const initialCount = orders.length;
        if (initialCount > 0) {
          const orderToDelete = orders[0];

          service.deleteWorkOrder(orderToDelete.docId);

          service.getWorkOrders$().pipe(take(1)).subscribe(updatedOrders => {
            expect(updatedOrders.length).toBe(initialCount - 1);
            expect(updatedOrders.find(o => o.docId === orderToDelete.docId)).toBeUndefined();
            done();
          });
        }
      });
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should persist work orders to localStorage', (done) => {
      service.getWorkCenters$().subscribe(centers => {
        if (centers.length > 0) {
          service.createWorkOrder({
            name: 'Persist Test',
            workCenterId: centers[0].docId,
            status: 'open',
            startDate: '2030-01-01',
            endDate: '2030-01-05'
          });

          const stored = localStorage.getItem('wo_work_orders');
          expect(stored).not.toBeNull();

          const orders = JSON.parse(stored!);
          expect(orders.some((o: WorkOrderDocument) => o.data.name === 'Persist Test')).toBe(true);
          done();
        }
      });
    });
  });
});
