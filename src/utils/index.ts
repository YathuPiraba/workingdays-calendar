import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { BannerEntry, CalendarEvent, PositionedEvent } from "../types";
import { toDateKey } from "./tz";

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
// Constants
// ---------------------------------------------------------------------------

export const HOUR_HEIGHT = 56; // px per hour
export const START_HOUR = 0; // 12 am
export const END_HOUR = 24; // midnight (exclusive)
export const TOTAL_HOURS = END_HOUR - START_HOUR;
export const GRID_HEIGHT = HOUR_HEIGHT * TOTAL_HOURS;

// Hours to display on the axis
export const AXIS_HOURS = Array.from(
  { length: TOTAL_HOURS },
  (_, i) => i + START_HOUR,
);

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DEFAULT_COLOR = "#6366f1";
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

export function daysBetween(startKey: string, endKey: string): number {
  if (startKey > endKey) return 0;
  const start = parseISO(startKey);
  const end = parseISO(endKey);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/** Parse any event date to a Date object. */
function parseEventDate(raw: string | Date | number): Date | null {
  if (raw instanceof Date) return raw;
  if (typeof raw === "number") return new Date(raw);
  if (typeof raw === "string") {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Convert a date to { hours, minutes } in fractional hours from midnight.
 * For date-only strings (no T), defaults to 0h (all-day, rendered at top).
 */
export function toFractionalHour(raw: string | Date | number): number {
  if (typeof raw === "string" && !/T/.test(raw)) return 0;
  const d = parseEventDate(raw);
  if (!d) return 0;
  return d.getHours() + d.getMinutes() / 60;
}

/** Duration in hours between two date values. Defaults to 1h if same time. */
export function durationHours(
  start: string | Date | number,
  end?: string | Date | number,
): number {
  if (!end) return 1;
  const s = parseEventDate(start);
  const e = parseEventDate(end);
  if (!s || !e) return 1;
  const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
  return diff > 0 ? diff : 1;
}

export function positionTimedEvents(
  events: CalendarEvent[],
  dayKey: string,
  tz: string,
): PositionedEvent[] {
  const timed = events.filter((ev) => {
    const key = toDateKey(ev.date, tz);
    return key === dayKey && !isAllDayEvent(ev);
  });

  timed.sort((a, b) => toFractionalHour(a.date) - toFractionalHour(b.date));

  const positioned: PositionedEvent[] = [];
  const columns: number[] = [];

  for (const ev of timed) {
    const startFrac = toFractionalHour(ev.date);
    const dur = durationHours(ev.date, ev.endDate);
    const endFrac = startFrac + dur;
    const top = (startFrac - START_HOUR) * HOUR_HEIGHT;
    const height = Math.max(dur * HOUR_HEIGHT, 24);

    let col = columns.findIndex((colEnd) => colEnd <= startFrac);
    if (col === -1) {
      col = columns.length;
      columns.push(endFrac);
    } else columns[col] = endFrac;

    positioned.push({ event: ev, top, height, column: col, totalColumns: 0 });
  }

  for (let i = 0; i < positioned.length; i++) {
    const a = positioned[i];
    const aEnd = a.top + a.height;
    let maxCol = a.column;
    for (let j = 0; j < positioned.length; j++) {
      if (i === j) continue;
      const b = positioned[j];
      if (a.top < b.top + b.height && aEnd > b.top)
        maxCol = Math.max(maxCol, b.column);
    }
    positioned[i] = { ...a, totalColumns: maxCol + 1 };
  }

  return positioned;
}

export function isAllDayEvent(ev: CalendarEvent): boolean {
  const raw = ev.date;
  if (raw instanceof Date) return false;
  if (typeof raw === "number") return false;
  if (typeof raw === "string" && !/T/.test(raw)) return true;
  return false;
}

export function buildBannerEntries(
  events: CalendarEvent[],
  weekDays: Date[],
  tz: string,
): BannerEntry[] {
  const weekStartKey = format(weekDays[0], "yyyy-MM-dd");
  const weekEndKey = format(weekDays[6], "yyyy-MM-dd");

  // All-day events that overlap this week
  const allDayEvs = events.filter((ev) => {
    if (!isAllDayEvent(ev)) return false;
    const startKey = toDateKey(ev.date, tz);
    if (!startKey) return false;
    const endKey = ev.endDate
      ? (toDateKey(ev.endDate, tz) ?? startKey)
      : startKey;
    return startKey <= weekEndKey && endKey >= weekStartKey;
  });

  // Longer spans first, then earlier start
  allDayEvs.sort((a, b) => {
    const aStart = toDateKey(a.date, tz) ?? "";
    const bStart = toDateKey(b.date, tz) ?? "";
    const aEnd = a.endDate ? (toDateKey(a.endDate, tz) ?? aStart) : aStart;
    const bEnd = b.endDate ? (toDateKey(b.endDate, tz) ?? bStart) : bStart;
    const aLen = differenceInCalendarDays(new Date(aEnd), new Date(aStart));
    const bLen = differenceInCalendarDays(new Date(bEnd), new Date(bStart));
    if (bLen !== aLen) return bLen - aLen;
    return aStart < bStart ? -1 : 1;
  });

  const entries: BannerEntry[] = [];
  // rowOccupied[colIndex] = Set of row numbers already taken
  const rowOccupied: Set<number>[] = Array.from({ length: 7 }, () => new Set());

  for (const ev of allDayEvs) {
    const startKey = toDateKey(ev.date, tz)!;
    const endKey = ev.endDate
      ? (toDateKey(ev.endDate, tz) ?? startKey)
      : startKey;

    // Clamp to visible week
    const clampedStart = startKey < weekStartKey ? weekStartKey : startKey;
    const clampedEnd = endKey > weekEndKey ? weekEndKey : endKey;

    const startCol = differenceInCalendarDays(
      new Date(clampedStart),
      weekDays[0],
    );
    const endCol = differenceInCalendarDays(new Date(clampedEnd), weekDays[0]);
    const colSpan = endCol - startCol + 1;

    // Find lowest row not occupied across all columns this span covers
    let row = 0;
    outer: for (row = 0; row < 20; row++) {
      for (let c = startCol; c <= endCol; c++) {
        if (rowOccupied[c]?.has(row)) continue outer;
      }
      break;
    }

    for (let c = startCol; c <= endCol; c++) {
      rowOccupied[c]?.add(row);
    }

    entries.push({ event: ev, startCol, colSpan, row });
  }

  return entries;
}
