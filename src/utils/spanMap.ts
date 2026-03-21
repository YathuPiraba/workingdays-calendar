/**
 * spanMap.ts — multi-day event span engine for WorkingCalendar
 *
 * Responsibilities:
 *  1. Normalise single-day and multi-day events into a unified SpanMap
 *  2. Assign stable track slots across rows (greedy interval packing)
 *  3. Tag each cell-slice with its SpanRole
 *  4. Resolve the overflow-chip anchor cell:
 *       • Start cell if it falls within the visible grid
 *       • Otherwise the first visible cell (firstVisible fallback)
 */

import { format, parseISO, addDays } from "date-fns";
import type { CalendarEvent } from "../types";
import type { SpanMap, SpanSegment, SpanRole } from "../types";
import { toDateKey, resolveEventTz } from "./tz";
import { daysBetween } from ".";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Parse any supported date value to a yyyy-MM-dd string, or null. */
function toKey(
  raw: string | Date | number | undefined,
  tz: string,
): string | null {
  if (raw === undefined) return null;
  return toDateKey(raw, tz);
}

/** Add N calendar days to a yyyy-MM-dd key string. */
function addDaysToKey(key: string, n: number): string {
  return format(addDays(parseISO(key), n), "yyyy-MM-dd");
}

/** Compare two yyyy-MM-dd strings. */
const keyLte = (a: string, b: string) => a <= b;

// ---------------------------------------------------------------------------
// Track-slot allocator (greedy interval packing per row)
// ---------------------------------------------------------------------------

/**
 * Given a list of [startKey, endKey] intervals already allocated on a row,
 * find the lowest 0-based slot that doesn't overlap the new interval.
 */
function allocateTrack(
  occupied: Array<{ startKey: string; endKey: string; track: number }>,
  startKey: string,
  endKey: string,
): number {
  for (let slot = 0; slot < 20; slot++) {
    const conflict = occupied.some(
      (o) =>
        o.track === slot &&
        keyLte(o.startKey, endKey) &&
        keyGte(o.endKey, startKey),
    );
    if (!conflict) return slot;
  }
  return 0; // fallback (shouldn't happen in practice)
}

function keyGte(a: string, b: string) {
  return a >= b;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export interface BuildSpanMapOptions {
  events: CalendarEvent[];
  /** All days in the rendered grid (including outside-month padding cells) */
  gridDays: Date[];
  /** First day of the visible month (yyyy-MM-dd) */
  monthStartKey: string;
  /** Last day of the visible month (yyyy-MM-dd) */
  monthEndKey: string;
  calendarTimezone?: string;
}

export function buildSpanMap({
  events,
  gridDays,
  calendarTimezone,
}: BuildSpanMapOptions): SpanMap {
  const map: SpanMap = new Map();

  // Initialise an empty array for every grid day
  const gridKeys = gridDays.map((d) => format(d, "yyyy-MM-dd"));
  for (const key of gridKeys) {
    map.set(key, []);
  }

  // Grid boundaries
  const gridStartKey = gridKeys[0];
  const gridEndKey = gridKeys[gridKeys.length - 1];

  // Build rows: array of arrays of keys (7 per row)
  const rows: string[][] = [];
  for (let i = 0; i < gridKeys.length; i += 7) {
    rows.push(gridKeys.slice(i, i + 7));
  }

  // Track-slot allocator state: per-row occupied intervals
  const rowOccupied: Array<
    Array<{ startKey: string; endKey: string; track: number }>
  > = rows.map(() => []);

  // Sort events: multi-day first (longer spans first), then by date, then priority desc
  const sorted = [...events].sort((a, b) => {
    const aTz = resolveEventTz(a.timezone, calendarTimezone);
    const bTz = resolveEventTz(b.timezone, calendarTimezone);
    const aStart = toKey(a.date, aTz) ?? "";
    const bStart = toKey(b.date, bTz) ?? "";
    const aEnd = a.endDate ? (toKey(a.endDate, aTz) ?? aStart) : aStart;
    const bEnd = b.endDate ? (toKey(b.endDate, bTz) ?? bStart) : bStart;
    const aLen = daysBetween(aStart, aEnd);
    const bLen = daysBetween(bStart, bEnd);
    if (bLen !== aLen) return bLen - aLen;
    if (aStart !== bStart) return aStart < bStart ? -1 : 1;
    return (b.priority ?? 0) - (a.priority ?? 0);
  });

  for (const event of sorted) {
    const tz = resolveEventTz(event.timezone, calendarTimezone);
    const startKey = toKey(event.date, tz);
    if (!startKey) continue;

    const rawEndKey = event.endDate ? toKey(event.endDate, tz) : null;
    // endDate must be >= startDate; if not, treat as single-day
    const endKey = rawEndKey && rawEndKey >= startKey ? rawEndKey : startKey;

    const isSingleDay = startKey === endKey;
    const totalDays = daysBetween(startKey, endKey) + 1;

    // Clamp to grid boundaries for rendering
    const clampedStart = startKey < gridStartKey ? gridStartKey : startKey;
    const clampedEnd = endKey > gridEndKey ? gridEndKey : endKey;

    // Skip events entirely outside the grid
    if (clampedStart > gridEndKey || clampedEnd < gridStartKey) continue;

    // Determine overflow anchor:
    //   • Prefer the true start cell if it's within the grid
    //   • Fallback: first visible cell (clampedStart)
    const anchorKey =
      startKey >= gridStartKey && startKey <= gridEndKey
        ? startKey
        : clampedStart;

    // Allocate track slots per row the event touches
    const trackByRow = new Map<number, number>();
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      const rowStart = row[0];
      const rowEnd = row[row.length - 1];
      if (clampedStart > rowEnd || clampedEnd < rowStart) continue;

      const segStart = clampedStart > rowStart ? clampedStart : rowStart;
      const segEnd = clampedEnd < rowEnd ? clampedEnd : rowEnd;

      const track = allocateTrack(rowOccupied[ri], segStart, segEnd);
      rowOccupied[ri].push({ startKey: segStart, endKey: segEnd, track });
      trackByRow.set(ri, track);
    }

    // Write SpanSegment into each cell the event occupies
    let current = clampedStart;
    while (current <= clampedEnd) {
      if (!map.has(current)) {
        current = addDaysToKey(current, 1);
        continue;
      }

      // Which row is this cell in?
      const ri = rows.findIndex(
        (row) => current >= row[0] && current <= row[row.length - 1],
      );
      const row = ri >= 0 ? rows[ri] : null;
      const track = ri >= 0 ? (trackByRow.get(ri) ?? 0) : 0;

      // Cells remaining in this row for this event
      let cellsRemainingInRow = 1;
      if (row) {
        const rowEnd = row[row.length - 1];
        const spanEndInRow = clampedEnd < rowEnd ? clampedEnd : rowEnd;
        cellsRemainingInRow = daysBetween(current, spanEndInRow) + 1;
      }

      // Role
      let role: SpanRole;
      if (isSingleDay) {
        role = "solo";
      } else if (current === startKey) {
        role = "start";
      } else if (current === clampedStart && startKey < gridStartKey) {
        role = "firstVisible";
      } else if (current === clampedEnd || current === endKey) {
        role = "end";
      } else if (current === clampedStart) {
        // row-wrap continuation that isn't the true start or true end
        role = "firstVisible";
      } else {
        role = "mid";
      }

      // Also tag row-wrap continuations (first cell of a new row mid-span)
      if (
        row &&
        current === row[0] &&
        current !== clampedStart &&
        current !== startKey
      ) {
        role = role === "end" ? "end" : "mid";
      }

      const segment: SpanSegment = {
        event,
        role,
        track,
        isOverflowAnchor: current === anchorKey,
        spanDays: totalDays,
        cellsRemainingInRow,
      };

      map.get(current)!.push(segment);
      current = addDaysToKey(current, 1);
    }
  }

  // Sort each cell's segments by track slot
  for (const [, segs] of map) {
    segs.sort((a, b) => a.track - b.track);
  }

  return map;
}
