import { describe, expect, it } from "vitest";
import {
  adjustWindow,
  boundWindow,
  initialWindow,
  rasterRatio,
  splitPercent,
  type Viewport,
} from "./reader-layout";
const desktop: Viewport = { width: 1440, height: 900, left: 0, top: 0 };
describe("bounded reader layout geometry", () => {
  it("starts compact and inside the visible desktop", () => {
    expect(initialWindow(desktop)).toEqual({
      x: 996,
      y: 316,
      width: 420,
      height: 560,
    });
    expect(splitPercent(70, 1440)).toBe(70);
  });
  it("keeps both docked panes usable at their resizing limits", () => {
    expect(splitPercent(100, 1000)).toBe(67.3);
    expect(splitPercent(-100, 1000)).toBe(32);
    expect(splitPercent(Number.NaN, 1440)).toBe(70);
  });
  it.each([
    [1920, 1080],
    [1440, 900],
    [1366, 768],
    [768, 1024],
    [390, 844],
    [320, 480],
    [390, 260],
  ])("never lets a window leave a %i × %i viewport", (width, height) => {
    const viewport = { width, height, left: 0, top: 0 };
    const rect = boundWindow(
      { x: -999, y: 99999, width: 99999, height: 99999 },
      viewport,
    );
    expect(rect.x).toBeGreaterThanOrEqual(8);
    expect(rect.y).toBeGreaterThanOrEqual(8);
    expect(rect.x + rect.width).toBeLessThanOrEqual(width - 8);
    expect(rect.y + rect.height).toBeLessThanOrEqual(height - 8);
  });
  it("respects visual viewport offsets and recovers from non-finite values", () => {
    const rect = boundWindow(
      { x: NaN, y: Infinity, width: NaN, height: Infinity },
      { width: 390, height: 500, left: 100, top: 200 },
    );
    expect(rect).toEqual({ x: 108, y: 208, width: 374, height: 484 });
  });
  it("moves the window without resizing its contents", () => {
    const rect = { x: 100, y: 100, width: 420, height: 400 };
    expect(adjustWindow(rect, 30, 40, false, desktop)).toEqual({
      ...rect,
      x: 130,
      y: 140,
    });
    expect(adjustWindow(rect, -999, -999, false, desktop)).toEqual({
      ...rect,
      x: 8,
      y: 8,
    });
  });
  it("resizes from an anchored corner and respects minimum dimensions", () => {
    const rect = { x: 100, y: 100, width: 420, height: 400 };
    expect(adjustWindow(rect, 100, 50, true, desktop)).toEqual({
      ...rect,
      width: 520,
      height: 450,
    });
    expect(adjustWindow(rect, -999, -999, true, desktop)).toEqual({
      ...rect,
      width: 320,
      height: 300,
    });
    expect(adjustWindow(rect, 99999, 99999, true, desktop)).toEqual({
      ...rect,
      width: 1332,
      height: 792,
    });
  });
  it("bounds the PDF raster allocation without changing CSS zoom", () => {
    expect(rasterRatio(800, 1100, 3)).toBe(2);
    for (const [width, height] of [
      [6000, 8000],
      [400, 20000],
      [10000, 12000],
      [100, 10000000],
    ]) {
      const ratio = rasterRatio(width, height, 2);
      expect(width * height * ratio ** 2).toBeLessThanOrEqual(16_000_001);
      expect(Math.max(width, height) * ratio).toBeLessThanOrEqual(8192);
    }
  });
});
