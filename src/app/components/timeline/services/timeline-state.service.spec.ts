import { TestBed } from '@angular/core/testing';
import { TimelineStateService, TimelinePanelState } from './timeline-state.service';
import { WorkOrderDocument } from '../../../models/work-order.model';

describe('TimelineStateService', () => {
  let service: TimelineStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimelineStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Hover State', () => {
    it('should initialize with null hover state', (done) => {
      service.hoveredRowId$.subscribe(rowId => {
        expect(rowId).toBeNull();
        done();
      });
    });

    it('should set hover state correctly', (done) => {
      const testRowId = 'row-123';
      const testWorkCenterId = 'wc-456';
      const testPosition = { x: 100, y: 200 };

      service.setHoverState(testRowId, testWorkCenterId, testPosition);

      service.hoveredRowId$.subscribe(rowId => {
        expect(rowId).toBe(testRowId);
      });

      service.hoverButtonPosition$.subscribe(position => {
        expect(position).toEqual(testPosition);
        done();
      });
    });

    it('should clear hover state', (done) => {
      // First set some state
      service.setHoverState('row-1', 'wc-1', { x: 50, y: 50 });

      // Then clear it
      service.clearHoverState();

      service.hoveredRowId$.subscribe(rowId => {
        expect(rowId).toBeNull();
      });

      service.hoverButtonPosition$.subscribe(position => {
        expect(position).toBeNull();
        done();
      });
    });

    it('should update only button position', (done) => {
      // Set initial state
      service.setHoverState('row-1', 'wc-1', { x: 10, y: 10 });

      // Update just position
      const newPosition = { x: 100, y: 100 };
      service.updateButtonPosition(newPosition);

      service.hoverButtonPosition$.subscribe(position => {
        expect(position).toEqual(newPosition);
      });

      // Row should remain unchanged
      service.hoveredRowId$.subscribe(rowId => {
        expect(rowId).toBe('row-1');
        done();
      });
    });

    it('should provide synchronous access to current hover state', () => {
      const testRowId = 'row-789';
      const testWorkCenterId = 'wc-101';
      const testPosition = { x: 150, y: 250 };

      service.setHoverState(testRowId, testWorkCenterId, testPosition);

      const currentState = service.currentHoverState;

      expect(currentState.rowId).toBe(testRowId);
      expect(currentState.workCenterId).toBe(testWorkCenterId);
      expect(currentState.buttonPosition).toEqual(testPosition);
    });
  });

  describe('Panel State', () => {
    it('should initialize with closed panel', (done) => {
      service.panelState$.subscribe(state => {
        expect(state.isOpen).toBe(false);
        expect(state.workCenterId).toBe('');
        expect(state.startDate).toBe('');
        expect(state.editingOrder).toBeNull();
        done();
      });
    });

    it('should open panel for creating new order', (done) => {
      const testWorkCenterId = 'wc-123';
      const testStartDate = '2024-06-01';

      service.openPanel(testWorkCenterId, testStartDate, null);

      service.panelState$.subscribe(state => {
        expect(state.isOpen).toBe(true);
        expect(state.workCenterId).toBe(testWorkCenterId);
        expect(state.startDate).toBe(testStartDate);
        expect(state.editingOrder).toBeNull();
        done();
      });
    });

    it('should open panel for editing order', (done) => {
      const testOrder: WorkOrderDocument = {
        docId: 'wo-1',
        docType: 'workOrder',
        data: {
          workCenterId: 'wc-456',
          name: 'Test Order',
          status: 'open',
          startDate: '2024-07-01',
          endDate: '2024-07-15'
        }
      };

      service.openPanel(testOrder.data.workCenterId, testOrder.data.startDate, testOrder);

      service.panelState$.subscribe(state => {
        expect(state.isOpen).toBe(true);
        expect(state.workCenterId).toBe(testOrder.data.workCenterId);
        expect(state.startDate).toBe(testOrder.data.startDate);
        expect(state.editingOrder).toEqual(testOrder);
        done();
      });
    });

    it('should close panel and reset state', (done) => {
      // First open the panel
      const testOrder: WorkOrderDocument = {
        docId: 'wo-1',
        docType: 'workOrder',
        data: {
          workCenterId: 'wc-456',
          name: 'Test Order',
          status: 'open',
          startDate: '2024-07-01',
          endDate: '2024-07-15'
        }
      };
      service.openPanel('wc-123', '2024-06-01', testOrder);

      // Then close it
      service.closePanel();

      service.panelState$.subscribe(state => {
        expect(state.isOpen).toBe(false);
        expect(state.workCenterId).toBe('');
        expect(state.startDate).toBe('');
        expect(state.editingOrder).toBeNull();
        done();
      });
    });
  });


  describe('State Isolation', () => {
    it('should not affect panel state when changing hover state', (done) => {
      service.openPanel('wc-1', '2024-01-01', null);
      service.setHoverState('row-1', 'wc-1', { x: 10, y: 10 });

      service.panelState$.subscribe(panelState => {
        expect(panelState.isOpen).toBe(true);
      });

      service.hoveredRowId$.subscribe(rowId => {
        expect(rowId).toBe('row-1');
        done();
      });
    });

    it('should not affect hover state when changing panel state', (done) => {
      service.setHoverState('row-1', 'wc-1', { x: 10, y: 10 });
      service.openPanel('wc-2', '2024-02-01', null);

      service.hoveredRowId$.subscribe(rowId => {
        expect(rowId).toBe('row-1');
      });

      service.panelState$.subscribe(panelState => {
        expect(panelState.isOpen).toBe(true);
        expect(panelState.workCenterId).toBe('wc-2');
        done();
      });
    });
  });
});
