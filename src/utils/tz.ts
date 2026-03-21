/**
 * tz.ts — timezone-aware date helpers for WorkingCalendar
 *
 * All date-fns-tz imports are isolated here so the rest of the codebase
 * never needs to touch the library directly. If timezone support is ever
 * removed, this is the only file that changes.
 *
 * Requires: date-fns-tz ^3.x
 */

import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { isValid, parseISO, format } from "date-fns";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The viewer's local IANA timezone string, resolved once at module load.
 * Falls back to "UTC" in environments where Intl is unavailable.
 */
export const LOCAL_TZ: string = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
})();

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Parses any supported date input into a native Date object.
 * Supports: ISO string | 'yyyy-MM-dd' | 'MM/dd/yyyy' | 'dd-MM-yyyy' | Date | timestamp.
 * Returns null for unrecognisable inputs rather than throwing.
 */
export function parseRawDate(raw: string | Date | number): Date | null {
  try {
    if (raw instanceof Date) return isValid(raw) ? raw : null;
    if (typeof raw === "number") {
      const d = new Date(raw);
      return isValid(d) ? d : null;
    }

    // yyyy-MM-dd  (ISO date — treat as local midnight, not UTC midnight)
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const d = parseISO(raw);
      return isValid(d) ? d : null;
    }

    // yyyy-MM-ddTHH:mm:ss or full ISO-8601 with offset/Z
    if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
      const d = parseISO(raw);
      return isValid(d) ? d : null;
    }

    // MM/dd/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const [mm, dd, yyyy] = raw.split("/");
      const d = new Date(`${yyyy}-${mm}-${dd}`);
      return isValid(d) ? d : null;
    }

    // dd-MM-yyyy
    if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
      const [dd, mm, yyyy] = raw.split("-");
      const d = new Date(`${yyyy}-${mm}-${dd}`);
      return isValid(d) ? d : null;
    }

    // Last resort — native Date constructor handles RFC 2822, etc.
    const d = new Date(raw);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

/**
 * Converts a date to its 'yyyy-MM-dd' key in the given timezone.
 *
 * This is the critical function for correct calendar placement:
 * - A UTC event at 2025-03-20T02:00:00Z is March 19 in New York (UTC-5) but
 *   March 20 everywhere east of UTC.
 * - Without timezone handling, the event always lands on March 20 for everyone.
 *
 * @param raw   Any supported date input
 * @param tz    IANA timezone string, e.g. "America/New_York". Defaults to LOCAL_TZ.
 * @returns     'yyyy-MM-dd' string or null if the input is unparseable
 */
export function toDateKey(
  raw: string | Date | number,
  tz: string = LOCAL_TZ,
): string | null {
  const date = parseRawDate(raw);
  if (!date) return null;

  try {
    // toZonedTime shifts the Date to represent wall-clock time in `tz`
    const zoned = toZonedTime(date, tz);
    return format(zoned, "yyyy-MM-dd");
  } catch {
    // Unknown timezone string — fall back to local formatting
    return isValid(date) ? format(date, "yyyy-MM-dd") : null;
  }
}

/**
 * Formats a date in a specific timezone using a date-fns format string.
 *
 * @example
 *   formatInTz(event.date, "America/New_York", "h:mm a zzz")
 *   // → "9:00 AM EST"
 */
export function formatInTz(
  raw: string | Date | number,
  tz: string,
  pattern: string,
): string | null {
  const date = parseRawDate(raw);
  if (!date) return null;

  try {
    return formatInTimeZone(date, tz, pattern);
  } catch {
    return null;
  }
}

/**
 * Returns a human-readable UTC offset string for a timezone at a given date.
 *
 * @example
 *   getUtcOffset("America/New_York", new Date()) // → "UTC−5"
 *   getUtcOffset("Asia/Colombo", new Date())     // → "UTC+5:30"
 */
export function getUtcOffset(tz: string, at: Date = new Date()): string {
  try {
    if (tz === "UTC") return "UTC+0";
    if (tz.startsWith("UTC+") || tz.startsWith("UTC-")) return tz;

    const offsetStr = formatInTimeZone(at, tz, "xxx");
    const sign = offsetStr[0] === "-" ? "−" : "+";
    const [h, m] = offsetStr.slice(1).split(":");
    const hours = parseInt(h, 10);
    const mins = parseInt(m, 10);

    return mins === 0 ? `UTC${sign}${hours}` : `UTC${sign}${hours}:${m}`;
  } catch {
    return "";
  }
}

/**
 * Resolves the effective timezone for an event.
 * Priority: event.timezone > calendarTimezone > LOCAL_TZ
 */
export function resolveEventTz(
  eventTz: string | undefined,
  calendarTz: string | undefined,
): string {
  return eventTz ?? calendarTz ?? LOCAL_TZ;
}

/**
 * Returns true if the given string looks like a valid IANA timezone.
 * Does a lightweight structural check + attempts to use it with Intl.
 */
export function isValidTimezone(tz: string): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
