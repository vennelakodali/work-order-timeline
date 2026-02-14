import { checkOverlap } from './overlap-detection';
import { WorkOrderDocument } from '../../../models/work-order.model';

describe('checkOverlap', () => {
  const mockOrders: WorkOrderDocument[] = [
    {
      docId: 'wo-1',
      docType: 'workOrder',
      data: {
        name: 'Order 1',
        workCenterId: 'wc-1',
        status: 'open',
        startDate: '2025-01-01',
        endDate: '2025-01-10'
      }
    },
    {
      docId: 'wo-2',
      docType: 'workOrder',
      data: {
        name: 'Order 2',
        workCenterId: 'wc-1',
        status: 'in-progress',
        startDate: '2025-01-15',
        endDate: '2025-01-25'
      }
    }
  ];

  describe('No Overlap Cases', () => {
    it('should return null when new order is before all existing orders', () => {
      const result = checkOverlap(mockOrders, '2024-12-01', '2024-12-15');
      expect(result).toBeNull();
    });

    it('should return null when new order is after all existing orders', () => {
      const result = checkOverlap(mockOrders, '2025-02-01', '2025-02-15');
      expect(result).toBeNull();
    });

    it('should return null when new order is between existing orders', () => {
      const result = checkOverlap(mockOrders, '2025-01-11', '2025-01-14');
      expect(result).toBeNull();
    });

    it('should return null when new order starts exactly when another ends', () => {
      const result = checkOverlap(mockOrders, '2025-01-10', '2025-01-15');
      expect(result).toBeNull();
    });

    it('should return null when new order ends exactly when another starts', () => {
      const result = checkOverlap(mockOrders, '2025-01-12', '2025-01-15');
      expect(result).toBeNull();
    });
  });

  describe('Overlap Cases', () => {
    it('should detect complete overlap (new order contains existing)', () => {
      const result = checkOverlap(mockOrders, '2024-12-01', '2025-02-01');
      expect(result).not.toBeNull();
      expect(result).toContain('Overlap detected');
      expect(result).toContain('Order 1');
    });

    it('should detect partial overlap from left', () => {
      const result = checkOverlap(mockOrders, '2024-12-25', '2025-01-05');
      expect(result).not.toBeNull();
      expect(result).toContain('Overlap detected');
    });

    it('should detect partial overlap from right', () => {
      const result = checkOverlap(mockOrders, '2025-01-05', '2025-01-15');
      expect(result).not.toBeNull();
      expect(result).toContain('Overlap detected');
    });

    it('should detect when new order is completely inside existing', () => {
      const result = checkOverlap(mockOrders, '2025-01-03', '2025-01-07');
      expect(result).not.toBeNull();
      expect(result).toContain('Overlap detected');
    });

    it('should detect exact same dates', () => {
      const result = checkOverlap(mockOrders, '2025-01-01', '2025-01-10');
      expect(result).not.toBeNull();
      expect(result).toContain('Overlap detected');
    });
  });

  describe('Exclude Order ID (Edit Mode)', () => {
    it('should exclude specified order from overlap check', () => {
      // Should not detect overlap with itself
      const result = checkOverlap(
        mockOrders,
        '2025-01-01',
        '2025-01-10',
        'wo-1' // Exclude this order
      );
      expect(result).toBeNull();
    });

    it('should still detect overlap with other orders when one is excluded', () => {
      const result = checkOverlap(
        mockOrders,
        '2025-01-01',
        '2025-01-10',
        'wo-2' // Exclude wo-2, should still overlap with wo-1
      );
      expect(result).not.toBeNull();
      expect(result).toContain('Order 1');
    });

    it('should allow updating order dates when not overlapping with others', () => {
      const result = checkOverlap(
        mockOrders,
        '2025-01-02',
        '2025-01-12',
        'wo-1' // Editing wo-1
      );
      expect(result).toBeNull();
    });
  });

  describe('Empty Order List', () => {
    it('should return null when checking against empty list', () => {
      const result = checkOverlap([], '2025-01-01', '2025-01-10');
      expect(result).toBeNull();
    });
  });

  describe('Error Message Format', () => {
    it('should include order name and dates in error message', () => {
      const result = checkOverlap(mockOrders, '2025-01-05', '2025-01-15');
      expect(result).toContain('Order 1');
      expect(result).toContain('2025-01-01');
      expect(result).toContain('2025-01-10');
    });
  });
});
