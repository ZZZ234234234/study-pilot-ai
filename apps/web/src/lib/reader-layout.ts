export type Viewport = {
  width: number;
  height: number;
  left: number;
  top: number;
};
export type WindowRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const finite = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Keep the title bar and resize control reachable, including after rotation/zoom. */
export function boundWindow(rect: WindowRect, viewport: Viewport): WindowRect {
  const availableWidth = Math.max(1, finite(viewport.width, 1440) - 16);
  const availableHeight = Math.max(1, finite(viewport.height, 900) - 16);
  const width = clamp(
    finite(rect.width, 420),
    Math.min(320, availableWidth),
    availableWidth,
  );
  const height = clamp(
    finite(rect.height, 560),
    Math.min(300, availableHeight),
    availableHeight,
  );
  const left = finite(viewport.left, 0) + 8;
  const top = finite(viewport.top, 0) + 8;
  return {
    width,
    height,
    x: clamp(finite(rect.x, left), left, left + availableWidth - width),
    y: clamp(finite(rect.y, top), top, top + availableHeight - height),
  };
}

export function initialWindow(viewport: Viewport): WindowRect {
  return boundWindow(
    {
      x: viewport.left + viewport.width - 444,
      y: viewport.top + Math.max(80, viewport.height - 584),
      width: 420,
      height: 560,
    },
    viewport,
  );
}

export function adjustWindow(
  rect: WindowRect,
  dx: number,
  dy: number,
  resize: boolean,
  viewport: Viewport,
) {
  if (!resize)
    return boundWindow({ ...rect, x: rect.x + dx, y: rect.y + dy }, viewport);
  // Resizing keeps the top-left anchor fixed instead of pushing the window sideways.
  return boundWindow(
    {
      ...rect,
      width: Math.min(
        rect.width + dx,
        viewport.left + viewport.width - 8 - rect.x,
      ),
      height: Math.min(
        rect.height + dy,
        viewport.top + viewport.height - 8 - rect.y,
      ),
    },
    viewport,
  );
}

export function splitPercent(value: number, width: number) {
  const minimum = Math.min(45, (320 / Math.max(1, width)) * 100);
  const maximum = Math.max(55, 100 - (327 / Math.max(1, width)) * 100);
  return clamp(finite(value, 70), minimum, maximum);
}

/** Limit raster memory independently of CSS zoom; never allocate an unbounded PDF canvas. */
export function rasterRatio(
  width: number,
  height: number,
  deviceRatio: number,
) {
  return Math.max(
    Number.EPSILON,
    Math.min(
      finite(deviceRatio, 1),
      2,
      Math.sqrt(16_000_000 / Math.max(1, width * height)),
      8192 / Math.max(1, width, height),
    ),
  );
}
