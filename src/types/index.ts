import type { ReactNode, RefObject } from "react";

// ---------------------------------------------------------------------------
// Core event shape — the base every consumer must satisfy
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  /** Unique identifier for the event */
  id: string;
  /** Target date in any supported format: 'yyyy-MM-dd' | 'MM/dd/yyyy' | 'dd-MM-yyyy' | Date | timestamp */
  date: string | Date | number;
  /** Short display label shown in the event pill */
  label: string;
  /**
   * Any valid CSS color string: hex (#3B8BD4), hsl(), rgb(), or a CSS custom
   * property (var(--brand-primary)). The pill will auto-derive a legible
   * foreground color from this value using perceived luminance.
   */
  color?: string;
  /**
   * Arbitrary payload passed through to renderEvent and renderTooltip.
   * The library never reads this — it is entirely yours to use.
   */
  data?: Record<string, unknown>;
  /** Higher number = rendered first within a cell. Default: 0 */
  priority?: number;
  /**
   * IANA timezone string for this event's date, e.g. "America/New_York".
   * When provided, the event is placed on the calendar day it falls on in that
   * timezone rather than the viewer's local timezone.
   * Overrides calendarTimezone on WorkingCalendarProps for this specific event.
   */
  timezone?: string;
  /** Called when the event pill (or custom renderEvent output) is clicked */
  onClick?: (event: CalendarEvent) => void;
}

export interface EventPillProps {
  event: CalendarEvent;
  trackIndex: number;
  dateKey: string;
  renderEvent?: WorkingCalendarProps["renderEvent"];
  renderTooltip?: WorkingCalendarProps["renderTooltip"];
  onEventClick?: (event: CalendarEvent) => void;
  calendarTimezone?: string;
}

export interface OverflowDialogProps {
  /** The date key ('yyyy-MM-dd') whose events are shown */
  dateKey: string;
  /** All events for that date (not just the hidden ones) */
  events: CalendarEvent[];
  /** Ref to the overflow chip button — used to position the dialog */
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  /** Called when the dialog should close */
  onClose: () => void;
  /** Forwarded from WorkingCalendarProps — fires when user clicks an event */
  onEventClick?: (event: CalendarEvent) => void;
  /** Forwarded from WorkingCalendarProps — custom right-page renderer */
  renderTooltip?: (event: CalendarEvent) => ReactNode;
  calendarTimezone?: string;
  eventActionLabel?: string;
}

// ---------------------------------------------------------------------------
// Render context passed to pluggable slots
// ---------------------------------------------------------------------------

export interface EventRenderContext {
  /** The resolved date key 'yyyy-MM-dd' for this cell */
  dateKey: string;
  /** Index of this event within the cell's visible track slots */
  trackIndex: number;
  /** Whether the tooltip is currently open for this event */
  tooltipOpen: boolean;
}

// ---------------------------------------------------------------------------
// MiniCalendar (internal, but exported for advanced consumers)
// ---------------------------------------------------------------------------

export interface MiniCalendarProps {
  currentMonth: number;
  currentYear: number;
  onSelect: (month: number, year: number) => void;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
}

// ---------------------------------------------------------------------------
// Main component props
// ---------------------------------------------------------------------------

export interface WorkingCalendarProps {
  /** Optional label shown top-left of the header bar */
  legend?: string;

  // — Disabled dates —
  /** Single date to disable */
  disableDate?: string | Date | number;
  /** Array of dates to disable */
  disabledDates?: Array<string | Date | number>;

  // — Selection modes —
  /** Enable multi-date selection mode */
  multiSelect?: boolean;
  /** Fired when user clicks the Add button after selecting dates (multiSelect mode) */
  onMultiSelect?: (dates: string[]) => void;
  /** Fired when user clicks the + icon on a single cell (non-multiSelect mode) */
  onDateClick?: (date: string) => void;

  // — Event system —
  /** Events to render in the calendar cells */
  events?: CalendarEvent[];
  /**
   * Maximum number of event pills to show per cell before collapsing into
   * a "+N more" chip. Defaults to 3.
   */
  maxVisibleEvents?: number;
  /**
   * Custom renderer for each event pill. Return any ReactNode.
   * Falls back to the default colored pill when omitted.
   */
  renderEvent?: (event: CalendarEvent, ctx: EventRenderContext) => ReactNode;
  /**
   * Custom renderer for the hover tooltip AND the overflow dialog right-page.
   * Return any ReactNode. Falls back to the default data-field view when omitted.
   */
  renderTooltip?: (event: CalendarEvent) => ReactNode;
  /**
   * Fired whenever the user clicks any event pill — in the grid or inside the
   * overflow dialog. Receives the full CalendarEvent so you can open a drawer,
   * navigate, or update state.
   */
  onEventClick?: (event: CalendarEvent) => void;

  // — Timezone —
  /**
   * IANA timezone string applied to all events that do not specify their own
   * timezone, e.g. "Europe/London". Defaults to the viewer's local timezone.
   * Use this when your event dates come from an API in a known timezone.
   *
   * @example "UTC" | "America/New_York" | "Asia/Colombo"
   */
  calendarTimezone?: string;

  // — Legend —
  /**
   * When true the dynamic event legend strip is hidden even if events exist.
   * Defaults to false (legend is shown whenever events are present).
   */
  hideLegend?: boolean;

  eventActionLabel?: string;

  multiSelectAddLabel?: string;

  /**
   * Fired whenever the visible month/year changes — via the prev/next arrows,
   * the Today button, or the MiniCalendar picker.
   * Receives the new month (1-indexed, 1 = January) and the new year.
   *
   * @example
   * <WorkingCalendar onMonthYearChange={(month, year) => fetchEvents(month, year)} />
   */
  onMonthYearChange?: (month: number, year: number) => void;
}

export interface OverflowChipProps {
  dayKey: string;
  hiddenCount: number;
  allCellEvents: CalendarEvent[];
  onOpen: (ref: React.RefObject<HTMLButtonElement>) => void;
}
