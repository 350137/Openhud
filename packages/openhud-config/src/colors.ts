/**
 * Red-Green-Blue-Alpha color representation.
 */
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/** Green threshold color (< 70% usage) — GitHub green */
export const CONTEXT_GREEN = "#3fb950";

/** Yellow threshold color (70-85% usage) — GitHub yellow */
export const CONTEXT_YELLOW = "#d29922";

/** Red threshold color (> 85% usage) — GitHub red */
export const CONTEXT_RED = "#f85149";

/**
 * Return the appropriate threshold hex color for a given usage percentage.
 *
 * @param pct - Usage percentage (0–100)
 * @param thresholds - Optional custom thresholds (defaults to warn: 70, danger: 85)
 * @returns Hex color string
 */
export function getThresholdColor(
  pct: number,
  thresholds?: { warn: number; danger: number },
): string {
  const warn = thresholds?.warn ?? 70;
  const danger = thresholds?.danger ?? 85;

  if (pct < 0) return CONTEXT_GREEN;
  if (pct >= danger) return CONTEXT_RED;
  if (pct >= warn) return CONTEXT_YELLOW;
  return CONTEXT_GREEN;
}

/**
 * Parse a hex color string (with or without leading #) into its R, G, B components.
 *
 * @returns RGBA object with r, g, b values (0–255)
 */
function parseHex(hex: string): RGBA {
  const cleaned = hex.replace(/^#/, "");
  let r: number;
  let g: number;
  let b: number;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0]! + cleaned[0], 16);
    g = parseInt(cleaned[1]! + cleaned[1], 16);
    b = parseInt(cleaned[2]! + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  } else if (cleaned.length === 8) {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  } else {
    return { r: 0, g: 0, b: 0 };
  }

  return {
    r: Number.isNaN(r) ? 0 : r,
    g: Number.isNaN(g) ? 0 : g,
    b: Number.isNaN(b) ? 0 : b,
  };
}

/**
 * Build the ANSI 256-color palette lookup table.
 * Indexes 16–231 form a 6×6×6 color cube; 232–255 are grayscale.
 */
function buildAnsiPalette(): RGBA[] {
  const palette: RGBA[] = [];

  // Standard colors (0–7) and high-intensity (8–15)
  const standard: [number, number, number][] = [
    [0, 0, 0],
    [128, 0, 0],
    [0, 128, 0],
    [128, 128, 0],
    [0, 0, 128],
    [128, 0, 128],
    [0, 128, 128],
    [192, 192, 192],
    [128, 128, 128],
    [255, 0, 0],
    [0, 255, 0],
    [255, 255, 0],
    [0, 0, 255],
    [255, 0, 255],
    [0, 255, 255],
    [255, 255, 255],
  ];
  for (const [r, g, b] of standard) {
    palette.push({ r, g, b });
  }

  // 6×6×6 color cube (16–231)
  for (let ri = 0; ri < 6; ri++) {
    for (let gi = 0; gi < 6; gi++) {
      for (let bi = 0; bi < 6; bi++) {
        const r = ri === 0 ? 0 : Math.round(ri * 40 + 55);
        const g = gi === 0 ? 0 : Math.round(gi * 40 + 55);
        const b = bi === 0 ? 0 : Math.round(bi * 40 + 55);
        palette.push({ r, g, b });
      }
    }
  }

  // Grayscale ramp (232–255)
  for (let i = 0; i < 24; i++) {
    const v = Math.round(i * 10 + 8);
    palette.push({ r: v, g: v, b: v });
  }

  return palette;
}

let cachedPalette: RGBA[] | undefined;

/**
 * Compute Euclidean distance squared between two RGBA colors (ignoring alpha).
 */
function colorDistanceSq(a: RGBA, b: RGBA): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

/**
 * Approximate a hex color string to the closest ANSI 256-color index.
 *
 * @param hex - Hex color string (e.g. "#3fb950" or "3fb950")
 * @returns ANSI 256-color index (0–255)
 */
export function hexToAnsi(hex: string): number {
  const rgb = parseHex(hex);
  const palette = cachedPalette ?? (cachedPalette = buildAnsiPalette());

  let bestIndex = 0;
  let bestDist = Infinity;

  for (let i = 0; i < palette.length; i++) {
    const dist = colorDistanceSq(rgb, palette[i]!);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }

  return bestIndex;
}
