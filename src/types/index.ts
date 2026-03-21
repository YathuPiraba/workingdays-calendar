import type { ReactNode, RefObject } from "react";

export type CalendarView = "month" | "week";

export interface CalendarEvent {
  id: string | number;
  date: string | Date | number;
  endDate?: string | Date | number;
  label: string;
  color?: string;
  data?: Record<string, unknown>;
  priority?: number;
  timezone?: string;
  onClick?: (event: CalendarEvent) => void;
}

export type SpanRole = "solo" | "start" | "mid" | "end" | "firstVisible";

export interface SpanSegment {
  event: CalendarEvent;
  role: SpanRole;
  track: number;
  isOverflowAnchor: boolean;
  spanDays: number;
  cellsRemainingInRow: number;
}

export type SpanMap = Map<string, SpanSegment[]>;

export interface BannerEntry {
  event: CalendarEvent;
  /** 0-based column index within the week (Sun = 0) */
  startCol: number;
  /** How many day columns this pill spans */
  colSpan: number;
  /** Stacking row within the banner */
  row: number;
}

/** Props and context types shared across calendar subcomponents. */
export interface EventPillProps {
  event: CalendarEvent;
  trackIndex: number;
  dateKey: string;
  spanRole?: SpanRole;
  cellsRemainingInRow?: number;
  renderEvent?: WorkingCalendarProps["renderEvent"];
  renderTooltip?: WorkingCalendarProps["renderTooltip"];
  onEventClick?: (event: CalendarEvent) => void;
  calendarTimezone?: string;
}

export interface OverflowDialogProps {
  dateKey: string;
  events: CalendarEvent[];
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onEventClick?: (event: CalendarEvent) => void;
  renderTooltip?: (event: CalendarEvent) => ReactNode;
  calendarTimezone?: string;
  eventActionLabel?: string;
}

export interface EventRenderContext {
  dateKey: string;
  trackIndex: number;
  tooltipOpen: boolean;
}

export interface MiniCalendarProps {
  currentMonth: number;
  currentYear: number;
  onSelect: (month: number, year: number) => void;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
}

export interface WorkingCalendarProps {
  legend?: string;
  disableDate?: string | Date | number;
  disabledDates?: Array<string | Date | number>;
  multiSelect?: boolean;
  onMultiSelectDates?: (dates: string[]) => void;
  onDateClick?: (date: string) => void;
  events?: CalendarEvent[];
  renderEvent?: (event: CalendarEvent, ctx: EventRenderContext) => ReactNode;
  renderTooltip?: (event: CalendarEvent) => ReactNode;
  onEventClick?: (event: CalendarEvent) => void;
  calendarTimezone?: string;
  hideLegend?: boolean;
  eventActionLabel?: string;
  multiSelectAddLabel?: string;
  onMonthYearChange?: (month: number, year: number) => void;
  weekView?: boolean;
  onViewChange?: (view: CalendarView) => void;
  onWeekChange?: (weekStartDate: string) => void;
}

export interface OverflowChipProps {
  dayKey: string;
  hiddenCount: number;
  allCellEvents: CalendarEvent[];
  onOpen: (ref: React.RefObject<HTMLButtonElement>) => void;
}

export interface SpanPillProps {
  color: string;
  fg: string;
  label: string;
  spanRole: SpanRole;
  cellsRemainingInRow: number;
  showLabel: boolean;
}

export interface WeekViewProps {
  weekDate: Date;
  events: CalendarEvent[];
  calendarTimezone?: string;
  onEventClick?: WorkingCalendarProps["onEventClick"];
  renderTooltip?: WorkingCalendarProps["renderTooltip"];
}

export interface PositionedEvent {
  event: CalendarEvent;
  top: number; // px from midnight
  height: number; // px
  column: number; // overlap column index (0-based)
  totalColumns: number;
  isAllDay?: boolean;
}
