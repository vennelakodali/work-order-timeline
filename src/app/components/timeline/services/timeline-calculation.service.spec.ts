import { TestBed } from '@angular/core/testing';
import { TimelineCalculationService } from './timeline-calculation.service';
import { WorkOrderDocument } from '../../../models/work-order.model';
import { TimelineColumnConfig } from '../utils/timeline-columns';

describe('TimelineCalculationService', () => {
  let service: TimelineCalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimelineCalculationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateColumns', () => {
    it('should generate columns for Month timescale', () => {
      const config = service.generateColumns('Month');

      expect(config.columns.length).toBeGreaterThan(0);
      expect(config.columnWidth).toBe(160); // Month column width
      expect(config.timelineStartDate).toBeDefined();
      expect(config.timelineEndDate).toBeDefined();
    });

    it('should generate columns for Week timescale', () => {
      const config = service.generateColumns('Week');

      expect(config.columns.length).toBeGreaterThan(0);
      expect(config.columnWidth).toBe(120); // Week column width
    });

    it('should generate columns for Day timescale', () => {
      const config = service.generateColumns('Day');

      expect(config.columns.length).toBeGreaterThan(0);
      expect(config.columnWidth).toBe(80); // Day column width
    });

    it('should accept a custom reference date', () => {
      const customDate = new Date(2024, 0, 15); // Jan 15, 2024
      const config = service.generateColumns('Month', customDate);

      expect(config.columns.length).toBeGreaterThan(0);
      expect(config.timelineStartDate).toBeDefined();
    });
  });


  describe('calculateBarStyle', () => {
    let mockConfig: TimelineColumnConfig;
    let mockOrder: WorkOrderDocument;

    beforeEach(() => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');

      mockConfig = {
        columns: [],
        columnWidth: 160,
        timelineStartDate: start,
        timelineEndDate: end
      };

      mockOrder = {
        docId: 'wo-1',
        docType: 'workOrder',
        data: {
          name: 'Test Order',
          workCenterId: 'wc-1',
          status: 'open',
          startDate: '2024-06-01',
          endDate: '2024-06-15'
        }
      };
    });

    it('should calculate bar position and width', () => {
      const totalWidth = 1600;
      const style = service.calculateBarStyle(mockOrder, mockConfig, totalWidth);

      expect(style.left).toBeGreaterThanOrEqual(0);
      expect(style.width).toBeGreaterThan(0);
      expect(typeof style.left).toBe('number');
      expect(typeof style.width).toBe('number');
    });

    it('should enforce minimum width of 40px', () => {
      // Very short duration
      mockOrder.data.startDate = '2024-06-01';
      mockOrder.data.endDate = '2024-06-01';

      const totalWidth = 1600;
      const style = service.calculateBarStyle(mockOrder, mockConfig, totalWidth);

      expect(style.width).toBeGreaterThanOrEqual(40);
    });
  });

  describe('calculateTodayPosition', () => {
    it('should calculate today position with work center offset', () => {
      const mockConfig: TimelineColumnConfig = {
        columns: [],
        columnWidth: 160,
        timelineStartDate: new Date('2024-01-01'),
        timelineEndDate: new Date('2024-12-31')
      };
      const totalWidth = 1600;
      const workCenterColumnWidth = 380;

      const position = service.calculateTodayPosition(mockConfig, totalWidth, workCenterColumnWidth);

      // Position should be at least the work center column width
      expect(position).toBeGreaterThanOrEqual(workCenterColumnWidth);
      expect(typeof position).toBe('number');
    });
  });

  describe('positionToDate', () => {
    let mockConfig: TimelineColumnConfig;

    beforeEach(() => {
      mockConfig = {
        columns: [],
        columnWidth: 160,
        timelineStartDate: new Date('2024-01-01'),
        timelineEndDate: new Date('2024-12-31')
      };
    });

    it('should convert position to ISO date string', () => {
      const totalWidth = 1600;
      const position = 800; // Middle of timeline

      const dateStr = service.positionToDate(position, mockConfig, totalWidth);

      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO format
      expect(new Date(dateStr).getTime()).toBeGreaterThan(mockConfig.timelineStartDate.getTime());
      expect(new Date(dateStr).getTime()).toBeLessThan(mockConfig.timelineEndDate.getTime());
    });

    it('should handle position at start', () => {
      const totalWidth = 1600;
      const position = 0;

      const dateStr = service.positionToDate(position, mockConfig, totalWidth);

      expect(dateStr).toBe('2024-01-01');
    });
  });

  describe('dateToPosition', () => {
    let mockConfig: TimelineColumnConfig;

    beforeEach(() => {
      mockConfig = {
        columns: [],
        columnWidth: 160,
        timelineStartDate: new Date('2024-01-01'),
        timelineEndDate: new Date('2024-12-31')
      };
    });

    it('should convert date string to position', () => {
      const totalWidth = 1600;
      const dateStr = '2024-06-01';

      const position = service.dateToPosition(dateStr, mockConfig, totalWidth);

      expect(position).toBeGreaterThanOrEqual(0);
      expect(position).toBeLessThanOrEqual(totalWidth);
      expect(typeof position).toBe('number');
    });

    it('should return 0 for start date', () => {
      const totalWidth = 1600;
      const dateStr = '2024-01-01';

      const position = service.dateToPosition(dateStr, mockConfig, totalWidth);

      expect(position).toBeCloseTo(0, 1);
    });

    it('should be inverse of positionToDate', () => {
      const totalWidth = 1600;
      const originalDate = '2024-07-15';

      const position = service.dateToPosition(originalDate, mockConfig, totalWidth);
      const convertedDate = service.positionToDate(position, mockConfig, totalWidth);

      expect(convertedDate).toBe(originalDate);
    });
  });
});
