import type { CalendarEvent } from "../types";

// ---------------------------------------------------------------------------
// Runtime validation helper (keeps the generic open for extension)
// ---------------------------------------------------------------------------

export function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" || v.id.trim() === "") return false;
  const dateOk =
    typeof v.date === "string" ||
    v.date instanceof Date ||
    typeof v.date === "number";
  if (!dateOk) return false;
  if (typeof v.label !== "string") return false;
  if (v.color !== undefined && typeof v.color !== "string") return false;
  if (
    v.data !== undefined &&
    (typeof v.data !== "object" || Array.isArray(v.data))
  )
    return false;
  if (v.priority !== undefined && typeof v.priority !== "number") return false;
  if (v.onClick !== undefined && typeof v.onClick !== "function") return false;
  return true;
}

/**
 * Validates an array of raw values against the CalendarEvent shape.
 * Returns { valid, invalid } so consumers can handle bad entries gracefully.
 */
export function validateEvents(raw: unknown[]): {
  valid: CalendarEvent[];
  invalid: unknown[];
} {
  const valid: CalendarEvent[] = [];
  const invalid: unknown[] = [];
  for (const item of raw) {
    if (isCalendarEvent(item)) {
      valid.push(item);
    } else {
      invalid.push(item);
    }
  }
  return { valid, invalid };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DEFAULT_COLOR = "#6366f1";

/**
 * Derives a foreground color (near-black or white) from any CSS color string
 * using perceived luminance via a 1x1 canvas. Falls back to white on failure.
 */
export function getForegroundColor(bg: string): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "#ffffff";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? "#1a1a1a" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}

export function formatDateLabel(dateKey: string): string {
  try {
    const d = new Date(dateKey + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateKey;
  }
}
