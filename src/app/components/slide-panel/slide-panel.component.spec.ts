import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SlidePanelComponent } from './slide-panel.component';
import { WorkOrderService } from '../../services/work-order.service';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SlidePanelComponent', () => {
  let component: SlidePanelComponent;
  let fixture: ComponentFixture<SlidePanelComponent>;
  let mockWorkOrderService: jasmine.SpyObj<WorkOrderService>;

  beforeEach(async () => {
    mockWorkOrderService = jasmine.createSpyObj('WorkOrderService', [
      'createWorkOrder',
      'updateWorkOrder'
    ]);

    await TestBed.configureTestingModule({
      imports: [SlidePanelComponent, ReactiveFormsModule, BrowserAnimationsModule],
      providers: [
        { provide: WorkOrderService, useValue: mockWorkOrderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SlidePanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form in create mode with default values', () => {
      component.mode = 'create';
      component.workCenterId = 'wc-1';
      component.startDate = '2025-01-01';
      component.ngOnInit();

      expect(component.form).toBeDefined();
      expect(component.form.get('name')?.value).toBe('');
      expect(component.form.get('status')?.value).toBe('open');
    });

    it('should initialize form in edit mode with existing order data', () => {
      const mockOrder = {
        docId: 'wo-1',
        docType: 'workOrder' as const,
        data: {
          name: 'Test Order',
          workCenterId: 'wc-1',
          status: 'in-progress' as const,
          startDate: '2025-01-01',
          endDate: '2025-01-10'
        }
      };

      component.mode = 'edit';
      component.editingOrder = mockOrder;
      component.ngOnInit();

      expect(component.form.get('name')?.value).toBe('Test Order');
      expect(component.form.get('status')?.value).toBe('in-progress');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.mode = 'create';
      component.workCenterId = 'wc-1';
      component.ngOnInit();
    });

    it('should require work order name', () => {
      const nameControl = component.form.get('name');
      nameControl?.setValue('');
      expect(nameControl?.hasError('required')).toBe(true);
    });

    it('should require status', () => {
      const statusControl = component.form.get('status');
      statusControl?.setValue(null);
      expect(statusControl?.hasError('required')).toBe(true);
    });

    it('should validate that end date is after start date', () => {
      component.form.patchValue({
        startDate: { year: 2025, month: 1, day: 10 },
        endDate: { year: 2025, month: 1, day: 5 }
      });

      expect(component.form.hasError('dateRange')).toBe(true);
    });

    it('should pass validation when end date is after start date', () => {
      component.form.patchValue({
        startDate: { year: 2025, month: 1, day: 5 },
        endDate: { year: 2025, month: 1, day: 10 }
      });

      expect(component.form.hasError('dateRange')).toBe(false);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.mode = 'create';
      component.workCenterId = 'wc-1';
      component.ngOnInit();
    });

    it('should not submit if form is invalid', () => {
      component.form.patchValue({
        name: '', // Invalid - required
        status: 'open'
      });

      component.onSubmit();

      expect(mockWorkOrderService.createWorkOrder).not.toHaveBeenCalled();
    });

    it('should create work order in create mode', () => {
      mockWorkOrderService.createWorkOrder.and.returnValue(null);

      component.form.patchValue({
        name: 'New Order',
        status: 'open',
        startDate: { year: 2025, month: 1, day: 1 },
        endDate: { year: 2025, month: 1, day: 10 }
      });

      spyOn(component.saved, 'emit');
      component.onSubmit();

      expect(mockWorkOrderService.createWorkOrder).toHaveBeenCalled();
      expect(component.saved.emit).toHaveBeenCalled();
    });

    it('should update work order in edit mode', () => {
      mockWorkOrderService.updateWorkOrder.and.returnValue(null);

      component.mode = 'edit';
      component.editingOrder = {
        docId: 'wo-1',
        docType: 'workOrder',
        data: {
          name: 'Original',
          workCenterId: 'wc-1',
          status: 'open',
          startDate: '2025-01-01',
          endDate: '2025-01-10'
        }
      };
      component.ngOnInit();

      component.form.patchValue({
        name: 'Updated Order'
      });

      spyOn(component.saved, 'emit');
      component.onSubmit();

      expect(mockWorkOrderService.updateWorkOrder).toHaveBeenCalledWith(
        'wo-1',
        jasmine.objectContaining({ name: 'Updated Order' })
      );
      expect(component.saved.emit).toHaveBeenCalled();
    });

    it('should display overlap error when service returns error', () => {
      mockWorkOrderService.createWorkOrder.and.returnValue('Overlap detected');

      component.form.patchValue({
        name: 'New Order',
        status: 'open',
        startDate: { year: 2025, month: 1, day: 1 },
        endDate: { year: 2025, month: 1, day: 10 }
      });

      spyOn(component.saved, 'emit');
      component.onSubmit();

      expect(component.overlapError).toBe('Overlap detected');
      expect(component.saved.emit).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Functionality', () => {
    it('should set isLeaving to true when cancelled', () => {
      component.onCancel();
      expect(component.isLeaving).toBe(true);
    });

    it('should emit close event after animation completes', () => {
      spyOn(component.close, 'emit');
      component.isLeaving = true;

      const mockEvent = {
        toState: 'void',
        fromState: '*'
      };

      component.onAnimationDone(mockEvent);

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call onCancel when Escape key is pressed', () => {
      spyOn(component, 'onCancel');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onKeydown(event);

      expect(component.onCancel).toHaveBeenCalled();
    });

    it('should not call onCancel for other keys', () => {
      spyOn(component, 'onCancel');

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeydown(event);

      expect(component.onCancel).not.toHaveBeenCalled();
    });
  });
});
