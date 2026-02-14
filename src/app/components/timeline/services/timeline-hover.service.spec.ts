import { TestBed } from '@angular/core/testing';
import { TimelineHoverService } from './timeline-hover.service';

describe('TimelineHoverService', () => {
  let service: TimelineHoverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimelineHoverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('shouldShowHoverButton', () => {
    const mockBars = [
      { left: 100, width: 50 },  // covers 100-150
      { left: 300, width: 80 }   // covers 300-380
    ];

    it('should return false when over work center column', () => {
      const result = service.shouldShowHoverButton(
        true,  // isOverWorkCenterColumn
        false, // isOverOrderBar
        200,   // xInTimeline
        mockBars
      );

      expect(result).toBe(false);
    });

    it('should return false when over order bar', () => {
      const result = service.shouldShowHoverButton(
        false, // isOverWorkCenterColumn
        true,  // isOverOrderBar
        200,   // xInTimeline
        mockBars
      );

      expect(result).toBe(false);
    });

    it('should return false when position overlaps a bar', () => {
      const result = service.shouldShowHoverButton(
        false, // isOverWorkCenterColumn
        false, // isOverOrderBar
        120,   // xInTimeline - overlaps first bar (100-150)
        mockBars
      );

      expect(result).toBe(false);
    });

    it('should return true when in empty space', () => {
      const result = service.shouldShowHoverButton(
        false, // isOverWorkCenterColumn
        false, // isOverOrderBar
        200,   // xInTimeline - empty space between bars
        mockBars
      );

      expect(result).toBe(true);
    });

    it('should return true when no bars exist', () => {
      const result = service.shouldShowHoverButton(
        false, // isOverWorkCenterColumn
        false, // isOverOrderBar
        200,   // xInTimeline
        []     // no bars
      );

      expect(result).toBe(true);
    });
  });

  describe('clientXToTimelineX', () => {
    it('should convert client X to timeline X with scroll', () => {
      const clientX = 500;
      const scrollRect = { left: 100, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
      const workCenterColumnWidth = 380;
      const scrollLeft = 200;

      const result = service.clientXToTimelineX(
        clientX,
        scrollRect,
        workCenterColumnWidth,
        scrollLeft
      );

      // 500 - 100 - 380 + 200 = 220
      expect(result).toBe(220);
    });

    it('should handle zero scroll', () => {
      const clientX = 600;
      const scrollRect = { left: 50, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
      const workCenterColumnWidth = 380;
      const scrollLeft = 0;

      const result = service.clientXToTimelineX(
        clientX,
        scrollRect,
        workCenterColumnWidth,
        scrollLeft
      );

      // 600 - 50 - 380 + 0 = 170
      expect(result).toBe(170);
    });

    it('should handle negative result (before timeline start)', () => {
      const clientX = 100;
      const scrollRect = { left: 50, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
      const workCenterColumnWidth = 380;
      const scrollLeft = 0;

      const result = service.clientXToTimelineX(
        clientX,
        scrollRect,
        workCenterColumnWidth,
        scrollLeft
      );

      // 100 - 50 - 380 + 0 = -330
      expect(result).toBe(-330);
    });
  });

  describe('isOverEmptySpace', () => {
    const bars = [
      { left: 50, width: 100 },   // covers 50-150
      { left: 200, width: 50 },   // covers 200-250
      { left: 400, width: 100 }   // covers 400-500
    ];

    it('should return false when position is at bar start', () => {
      const result = service.isOverEmptySpace(50, bars);
      expect(result).toBe(false);
    });

    it('should return false when position is at bar end', () => {
      const result = service.isOverEmptySpace(150, bars);
      expect(result).toBe(false);
    });

    it('should return false when position is in middle of bar', () => {
      const result = service.isOverEmptySpace(100, bars);
      expect(result).toBe(false);
    });

    it('should return true when position is before all bars', () => {
      const result = service.isOverEmptySpace(20, bars);
      expect(result).toBe(true);
    });

    it('should return true when position is between bars', () => {
      const result = service.isOverEmptySpace(175, bars);
      expect(result).toBe(true);
    });

    it('should return true when position is after all bars', () => {
      const result = service.isOverEmptySpace(600, bars);
      expect(result).toBe(true);
    });

    it('should return true when bars array is empty', () => {
      const result = service.isOverEmptySpace(100, []);
      expect(result).toBe(true);
    });

    it('should handle single bar', () => {
      const singleBar = [{ left: 100, width: 50 }];

      expect(service.isOverEmptySpace(50, singleBar)).toBe(true);   // before
      expect(service.isOverEmptySpace(125, singleBar)).toBe(false); // inside
      expect(service.isOverEmptySpace(200, singleBar)).toBe(true);  // after
    });
  });

  describe('isCursorOutsideButtonBounds', () => {
    const buttonPosition = { x: 200, y: 100 };
    const buttonBounds = { width: 113, height: 38, margin: 20 };

    it('should return false when cursor is at button center', () => {
      const result = service.isCursorOutsideButtonBounds(
        200, 100, // cursor at exact position
        buttonPosition,
        buttonBounds
      );

      expect(result).toBe(false);
    });

    it('should return false when cursor is just inside horizontal margin', () => {
      // Half width (56.5) + margin (20) = 76.5
      const result = service.isCursorOutsideButtonBounds(
        275, 100, // 75 pixels away horizontally (within margin)
        buttonPosition,
        buttonBounds
      );

      expect(result).toBe(false);
    });

    it('should return false when cursor is just inside vertical margin', () => {
      // Half height (19) + margin (20) = 39
      const result = service.isCursorOutsideButtonBounds(
        200, 138, // 38 pixels away vertically (within margin)
        buttonPosition,
        buttonBounds
      );

      expect(result).toBe(false);
    });

    it('should return true when cursor is outside horizontal bounds', () => {
      const result = service.isCursorOutsideButtonBounds(
        300, 100, // 100 pixels away horizontally (outside margin)
        buttonPosition,
        buttonBounds
      );

      expect(result).toBe(true);
    });

    it('should return true when cursor is outside vertical bounds', () => {
      const result = service.isCursorOutsideButtonBounds(
        200, 200, // 100 pixels away vertically (outside margin)
        buttonPosition,
        buttonBounds
      );

      expect(result).toBe(true);
    });

    it('should return true when cursor is outside both bounds', () => {
      const result = service.isCursorOutsideButtonBounds(
        300, 200, // far away in both directions
        buttonPosition,
        buttonBounds
      );

      expect(result).toBe(true);
    });

    it('should handle negative distances (cursor on opposite side)', () => {
      const result = service.isCursorOutsideButtonBounds(
        100, 50, // cursor to the left and above
        buttonPosition,
        buttonBounds
      );

      // Uses Math.abs, so should still check distance correctly
      expect(result).toBe(true);
    });
  });

  describe('calculateButtonPosition', () => {
    it('should position button at mouse X and row vertical center', () => {
      const mouseEvent = { clientX: 250, clientY: 150 };
      const rowRect = { top: 100, height: 60 };

      const result = service.calculateButtonPosition(mouseEvent, rowRect);

      expect(result.x).toBe(250);         // mouse X
      expect(result.y).toBe(130);         // top (100) + height/2 (30) = 130
    });

    it('should handle row at different vertical position', () => {
      const mouseEvent = { clientX: 500, clientY: 300 };
      const rowRect = { top: 200, height: 80 };

      const result = service.calculateButtonPosition(mouseEvent, rowRect);

      expect(result.x).toBe(500);
      expect(result.y).toBe(240);         // top (200) + height/2 (40) = 240
    });

    it('should handle small row height', () => {
      const mouseEvent = { clientX: 100, clientY: 50 };
      const rowRect = { top: 40, height: 20 };

      const result = service.calculateButtonPosition(mouseEvent, rowRect);

      expect(result.x).toBe(100);
      expect(result.y).toBe(50);          // top (40) + height/2 (10) = 50
    });

    it('should ignore mouse Y coordinate', () => {
      const mouseEvent1 = { clientX: 300, clientY: 100 };
      const mouseEvent2 = { clientX: 300, clientY: 500 };
      const rowRect = { top: 150, height: 40 };

      const result1 = service.calculateButtonPosition(mouseEvent1, rowRect);
      const result2 = service.calculateButtonPosition(mouseEvent2, rowRect);

      // Same Y result regardless of mouse Y
      expect(result1.y).toBe(result2.y);
      expect(result1.y).toBe(170);        // top (150) + height/2 (20) = 170
    });
  });
});
