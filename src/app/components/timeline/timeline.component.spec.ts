import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimelineComponent } from './timeline.component';
import { WorkOrderService } from '../../services/work-order.service';
import { TimelineStateService } from './services/timeline-state.service';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('TimelineComponent', () => {
  let component: TimelineComponent;
  let fixture: ComponentFixture<TimelineComponent>;
  let mockWorkOrderService: jasmine.SpyObj<WorkOrderService>;
  let timelineStateService: TimelineStateService;

  const mockWorkCenters = [
    { docId: 'wc-1', docType: 'workCenter' as const, data: { name: 'Center 1' } },
    { docId: 'wc-2', docType: 'workCenter' as const, data: { name: 'Center 2' } }
  ];

  const mockWorkOrders = [
    {
      docId: 'wo-1',
      docType: 'workOrder' as const,
      data: {
        name: 'Order 1',
        workCenterId: 'wc-1',
        status: 'open' as const,
        startDate: '2025-01-01',
        endDate: '2025-01-10'
      }
    }
  ];

  beforeEach(async () => {
    mockWorkOrderService = jasmine.createSpyObj('WorkOrderService', [
      'getWorkCenters$',
      'getWorkOrders$',
      'deleteWorkOrder'
    ]);

    mockWorkOrderService.getWorkCenters$.and.returnValue(of(mockWorkCenters));
    mockWorkOrderService.getWorkOrders$.and.returnValue(of(mockWorkOrders));

    await TestBed.configureTestingModule({
      imports: [TimelineComponent, BrowserAnimationsModule],
      providers: [
        { provide: WorkOrderService, useValue: mockWorkOrderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
    timelineStateService = TestBed.inject(TimelineStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load work centers on init', () => {
    expect(component.workCenters).toEqual(mockWorkCenters);
  });

  it('should load work orders on init', () => {
    expect(component.workOrders).toEqual(mockWorkOrders);
  });

  describe('Timescale Changes', () => {
    it('should update timescale when changed', () => {
      component.onTimescaleChange('Day');
      expect(component.timescale).toBe('Day');
    });

    it('should regenerate columns when timescale changes', () => {
      component.onTimescaleChange('Week');
      expect(component.columns.length).toBeGreaterThan(0);
    });
  });

  describe('Panel Operations', () => {
    it('should open create panel with work center and date', (done) => {
      timelineStateService.openPanel('wc-1', '2025-01-01', null);

      timelineStateService.panelState$.subscribe(panelState => {
        expect(panelState.isOpen).toBe(true);
        expect(panelState.workCenterId).toBe('wc-1');
        expect(panelState.startDate).toBe('2025-01-01');
        done();
      });
    });

    it('should open edit panel with work order data', (done) => {
      timelineStateService.openPanel('wc-1', '2025-01-01', mockWorkOrders[0]);

      timelineStateService.panelState$.subscribe(panelState => {
        expect(panelState.isOpen).toBe(true);
        expect(panelState.editingOrder).toBe(mockWorkOrders[0]);
        done();
      });
    });

    it('should close panel and reset state', (done) => {
      timelineStateService.openPanel('wc-1', '2025-01-01', null);
      timelineStateService.closePanel();

      timelineStateService.panelState$.subscribe(panelState => {
        expect(panelState.isOpen).toBe(false);
        expect(panelState.editingOrder).toBeNull();
        done();
      });
    });
  });

  describe('Work Order Operations', () => {
    it('should delete work order', () => {
      component.onDeleteOrder('wo-1');
      expect(mockWorkOrderService.deleteWorkOrder).toHaveBeenCalledWith('wo-1');
    });

    it('should open edit panel for work order', (done) => {
      component.openEditPanel(mockWorkOrders[0]);

      timelineStateService.panelState$.subscribe(panelState => {
        expect(panelState.isOpen).toBe(true);
        expect(panelState.editingOrder).toBe(mockWorkOrders[0]);
        expect(panelState.workCenterId).toBe(mockWorkOrders[0].data.workCenterId);
        expect(panelState.startDate).toBe(mockWorkOrders[0].data.startDate);
        done();
      });
    });
  });

  describe('Orders Filtering', () => {
    it('should get orders for specific work center', () => {
      const orders = component.getOrdersForCenter('wc-1');
      expect(orders.length).toBe(1);
      expect(orders[0].data.workCenterId).toBe('wc-1');
    });

    it('should return empty array for work center with no orders', () => {
      const orders = component.getOrdersForCenter('wc-2');
      expect(orders.length).toBe(0);
    });
  });

  describe('TrackBy Functions', () => {
    it('should track work centers by docId', () => {
      const result = component.trackByCenter(0, mockWorkCenters[0]);
      expect(result).toBe('wc-1');
    });

    it('should track work orders by docId', () => {
      const result = component.trackByOrder(0, mockWorkOrders[0]);
      expect(result).toBe('wo-1');
    });

    it('should track columns by label', () => {
      const mockColumn = {
        label: 'Jan 1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-01')
      };
      const result = component.trackByColumn(0, mockColumn);
      expect(result).toBe('Jan 1');
    });
  });
});
