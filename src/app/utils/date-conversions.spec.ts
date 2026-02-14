import { isoToNgbDate, ngbDateToIso, ngbDateToDate, formatNgbDate } from './date-conversions';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

describe('Date Conversion Utilities', () => {
  describe('isoToNgbDate', () => {
    it('should convert ISO date string to NgbDateStruct', () => {
      const result = isoToNgbDate('2025-03-15');
      expect(result).toEqual({ year: 2025, month: 3, day: 15 });
    });

    it('should handle single-digit months and days', () => {
      const result = isoToNgbDate('2025-01-05');
      expect(result).toEqual({ year: 2025, month: 1, day: 5 });
    });

    it('should handle end of year', () => {
      const result = isoToNgbDate('2025-12-31');
      expect(result).toEqual({ year: 2025, month: 12, day: 31 });
    });
  });

  describe('ngbDateToIso', () => {
    it('should convert NgbDateStruct to ISO date string', () => {
      const ngbDate: NgbDateStruct = { year: 2025, month: 3, day: 15 };
      const result = ngbDateToIso(ngbDate);
      expect(result).toBe('2025-03-15');
    });

    it('should pad single-digit months and days with zeros', () => {
      const ngbDate: NgbDateStruct = { year: 2025, month: 1, day: 5 };
      const result = ngbDateToIso(ngbDate);
      expect(result).toBe('2025-01-05');
    });

    it('should handle December 31st', () => {
      const ngbDate: NgbDateStruct = { year: 2025, month: 12, day: 31 };
      const result = ngbDateToIso(ngbDate);
      expect(result).toBe('2025-12-31');
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve date through ISO -> NgbDate -> ISO conversion', () => {
      const originalIso = '2025-06-15';
      const ngbDate = isoToNgbDate(originalIso);
      const resultIso = ngbDateToIso(ngbDate);
      expect(resultIso).toBe(originalIso);
    });

    it('should preserve date through NgbDate -> ISO -> NgbDate conversion', () => {
      const originalNgb: NgbDateStruct = { year: 2025, month: 6, day: 15 };
      const iso = ngbDateToIso(originalNgb);
      const resultNgb = isoToNgbDate(iso);
      expect(resultNgb).toEqual(originalNgb);
    });
  });

  describe('ngbDateToDate', () => {
    it('should convert NgbDateStruct to JavaScript Date', () => {
      const ngbDate: NgbDateStruct = { year: 2025, month: 3, day: 15 };
      const result = ngbDateToDate(ngbDate);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(2); // JavaScript months are 0-indexed
      expect(result.getDate()).toBe(15);
    });

    it('should handle start of year', () => {
      const ngbDate: NgbDateStruct = { year: 2025, month: 1, day: 1 };
      const result = ngbDateToDate(ngbDate);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(1);
    });

    it('should handle end of year', () => {
      const ngbDate: NgbDateStruct = { year: 2025, month: 12, day: 31 };
      const result = ngbDateToDate(ngbDate);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(31);
    });
  });

  describe('formatNgbDate', () => {
    it('should format NgbDateStruct as readable string', () => {
      const ngbDate: NgbDateStruct = { year: 2025, month: 3, day: 15 };
      const result = formatNgbDate(ngbDate);
      expect(result).toBe('03.15.2025');
    });

    it('should handle single-digit days', () => {
      const ngbDate: NgbDateStruct = { year: 2025, month: 1, day: 5 };
      const result = formatNgbDate(ngbDate);
      expect(result).toBe('01.05.2025');
    });

    it('should handle all months correctly', () => {
      const testCases = [
        { month: 1, expected: '01.15.2025' },
        { month: 2, expected: '02.15.2025' },
        { month: 3, expected: '03.15.2025' },
        { month: 4, expected: '04.15.2025' },
        { month: 5, expected: '05.15.2025' },
        { month: 6, expected: '06.15.2025' },
        { month: 7, expected: '07.15.2025' },
        { month: 8, expected: '08.15.2025' },
        { month: 9, expected: '09.15.2025' },
        { month: 10, expected: '10.15.2025' },
        { month: 11, expected: '11.15.2025' },
        { month: 12, expected: '12.15.2025' }
      ];

      testCases.forEach(({ month, expected }) => {
        const ngbDate: NgbDateStruct = { year: 2025, month, day: 15 };
        const result = formatNgbDate(ngbDate);
        expect(result).toBe(expected);
      });
    });

    it('should return empty string for null input', () => {
      const result = formatNgbDate(null);
      expect(result).toBe('');
    });
  });
});
