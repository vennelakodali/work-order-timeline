import { generateTimelineColumns, TimelineColumnConfig } from './timeline-columns';

describe('timeline-columns utilities', () => {
  describe('generateTimelineColumns', () => {
    const referenceDate = new Date('2024-06-15T12:00:00'); // Saturday, June 15, 2024

    describe('Hour timescale', () => {
      let config: TimelineColumnConfig;

      beforeEach(() => {
        config = generateTimelineColumns('Hour', referenceDate);
      });

      it('should generate columns with correct width', () => {
        expect(config.columnWidth).toBe(60);
      });

      it('should generate columns spanning +/-12 hours (25 total columns)', () => {
        // -12 to +12 inclusive = 25 hours
        expect(config.columns.length).toBe(25);
      });

      it('should have columns covering 1-hour intervals', () => {
        const firstCol = config.columns[0];
        const secondCol = config.columns[1];

        const diff = secondCol.startDate.getTime() - firstCol.startDate.getTime();
        const oneHour = 60 * 60 * 1000;

        expect(diff).toBe(oneHour);
      });

      it('should have columns with 1-hour duration', () => {
        config.columns.forEach(col => {
          const duration = col.endDate.getTime() - col.startDate.getTime();
          const oneHour = 60 * 60 * 1000;
          expect(duration).toBe(oneHour);
        });
      });

      it('should have labels in time format', () => {
        // Labels should be in format like "12:00 PM"
        const label = config.columns[12].label; // Middle column (noon)
        expect(label).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
      });
    });

    describe('Day timescale', () => {
      let config: TimelineColumnConfig;

      beforeEach(() => {
        config = generateTimelineColumns('Day', referenceDate);
      });

      it('should generate columns with correct width', () => {
        expect(config.columnWidth).toBe(80);
      });

      it('should generate columns spanning +/-30 days (61 total columns)', () => {
        // -30 to +30 inclusive = 61 days
        expect(config.columns.length).toBe(61);
      });

      it('should have columns covering 1-day intervals', () => {
        const firstCol = config.columns[0];
        const secondCol = config.columns[1];

        const diff = secondCol.startDate.getTime() - firstCol.startDate.getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        expect(diff).toBe(oneDay);
      });

      it('should have columns with 1-day duration', () => {
        config.columns.forEach(col => {
          const duration = col.endDate.getTime() - col.startDate.getTime();
          const oneDay = 24 * 60 * 60 * 1000;
          expect(duration).toBe(oneDay);
        });
      });

      it('should have labels in date format', () => {
        // Labels should be in format like "Jun 15"
        const label = config.columns[30].label; // Middle column
        expect(label).toMatch(/[A-Z][a-z]{2}\s\d{1,2}/);
      });
    });

    describe('Week timescale', () => {
      let config: TimelineColumnConfig;

      beforeEach(() => {
        config = generateTimelineColumns('Week', referenceDate);
      });

      it('should generate columns with correct width', () => {
        expect(config.columnWidth).toBe(120);
      });

      it('should generate columns spanning +/-12 weeks', () => {
        // Should have approximately 24-25 weeks worth of columns
        expect(config.columns.length).toBeGreaterThanOrEqual(24);
        expect(config.columns.length).toBeLessThanOrEqual(26);
      });

      it('should have columns covering 7-day intervals', () => {
        const firstCol = config.columns[0];
        const secondCol = config.columns[1];

        const diff = secondCol.startDate.getTime() - firstCol.startDate.getTime();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        expect(diff).toBe(oneWeek);
      });

      it('should have columns with 7-day duration', () => {
        config.columns.forEach(col => {
          const duration = col.endDate.getTime() - col.startDate.getTime();
          const oneWeek = 7 * 24 * 60 * 60 * 1000;
          expect(duration).toBe(oneWeek);
        });
      });

      it('should have labels in week range format', () => {
        // Labels should be in format like "Jun 10 - 16"
        const label = config.columns[0].label;
        expect(label).toMatch(/[A-Z][a-z]{2}\s\d{1,2}\s-\s\d{1,2}/);
      });

      it('should align weeks to Monday', () => {
        config.columns.forEach(col => {
          const dayOfWeek = col.startDate.getDay();
          expect(dayOfWeek).toBe(1); // Monday is 1
        });
      });
    });

    describe('Month timescale', () => {
      let config: TimelineColumnConfig;

      beforeEach(() => {
        config = generateTimelineColumns('Month', referenceDate);
      });

      it('should generate columns with correct width', () => {
        expect(config.columnWidth).toBe(160);
      });

      it('should generate columns spanning +/-8 months (17 total columns)', () => {
        // -8 to +8 inclusive = 17 months
        expect(config.columns.length).toBe(17);
      });

      it('should have labels in month-year format', () => {
        // Labels should be in format like "Jun 2024"
        const label = config.columns[8].label; // Middle column
        expect(label).toMatch(/[A-Z][a-z]{2}\s\d{4}/);
      });

      it('should align columns to month boundaries', () => {
        config.columns.forEach(col => {
          // Each column should start on the 1st of the month
          expect(col.startDate.getDate()).toBe(1);
        });
      });

      it('should have column end dates at next month start', () => {
        config.columns.forEach(col => {
          // End date should be the 1st of the next month
          expect(col.endDate.getDate()).toBe(1);

          // End month should be one more than start month (accounting for year wrap)
          const startMonth = col.startDate.getMonth();
          const endMonth = col.endDate.getMonth();
          const expectedEndMonth = (startMonth + 1) % 12;

          expect(endMonth).toBe(expectedEndMonth);
        });
      });
    });

    describe('default timescale', () => {
      it('should default to Month when timescale is unknown', () => {
        const config = generateTimelineColumns('Unknown', referenceDate);

        expect(config.columnWidth).toBe(160);
        expect(config.columns.length).toBe(17); // Same as Month
      });
    });

    describe('reference date handling', () => {
      it('should use current date when no reference date provided', () => {
        const config = generateTimelineColumns('Month');

        expect(config.columns.length).toBeGreaterThan(0);
        expect(config.columnWidth).toBe(160);
      });

      it('should normalize reference date to midnight', () => {
        const dateWithTime = new Date('2024-06-15T15:30:45.123');
        const config = generateTimelineColumns('Day', dateWithTime);

        // The generated columns should use normalized dates (no time component)
        config.columns.forEach(col => {
          expect(col.startDate.getHours()).toBe(0);
          expect(col.startDate.getMinutes()).toBe(0);
          expect(col.startDate.getSeconds()).toBe(0);
        });
      });
    });

    describe('timeline boundaries', () => {
      it('should set correct timeline start and end dates for Day', () => {
        const config = generateTimelineColumns('Day', referenceDate);

        // Timeline should span from -30 days to +30 days
        const expectedStart = new Date(referenceDate);
        expectedStart.setDate(expectedStart.getDate() - 30);
        expectedStart.setHours(0, 0, 0, 0);

        const expectedEnd = new Date(referenceDate);
        expectedEnd.setDate(expectedEnd.getDate() + 30);
        expectedEnd.setHours(0, 0, 0, 0);

        expect(config.timelineStartDate.getTime()).toBe(expectedStart.getTime());
        expect(config.timelineEndDate.getTime()).toBe(expectedEnd.getTime());
      });

      it('should set correct timeline start and end dates for Month', () => {
        const config = generateTimelineColumns('Month', referenceDate);

        // Timeline start should be first day of month -8 months
        expect(config.timelineStartDate.getDate()).toBe(1);

        // Timeline end should be last day of month +8 months
        const endDate = config.timelineEndDate;
        const nextMonth = new Date(endDate);
        nextMonth.setDate(nextMonth.getDate() + 1);

        // If adding a day crosses into next month, we know we're at month end
        expect(nextMonth.getDate()).toBe(1);
      });
    });

    describe('column continuity', () => {
      it('should have no gaps between columns for Day timescale', () => {
        const config = generateTimelineColumns('Day', referenceDate);

        for (let i = 0; i < config.columns.length - 1; i++) {
          const currentEnd = config.columns[i].endDate;
          const nextStart = config.columns[i + 1].startDate;

          expect(currentEnd.getTime()).toBe(nextStart.getTime());
        }
      });

      it('should have no gaps between columns for Month timescale', () => {
        const config = generateTimelineColumns('Month', referenceDate);

        for (let i = 0; i < config.columns.length - 1; i++) {
          const currentEnd = config.columns[i].endDate;
          const nextStart = config.columns[i + 1].startDate;

          expect(currentEnd.getTime()).toBe(nextStart.getTime());
        }
      });

      it('should have no gaps between columns for Week timescale', () => {
        const config = generateTimelineColumns('Week', referenceDate);

        for (let i = 0; i < config.columns.length - 1; i++) {
          const currentEnd = config.columns[i].endDate;
          const nextStart = config.columns[i + 1].startDate;

          expect(currentEnd.getTime()).toBe(nextStart.getTime());
        }
      });
    });
  });
});
