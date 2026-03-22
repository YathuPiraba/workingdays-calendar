import { useRef, useMemo, useState, useCallback } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  getWeek,
  isToday,
  isWeekend,
  startOfMonth,
  startOfWeek,
  isSameMonth,
} from "date-fns";
import { toDateKey, resolveEventTz, LOCAL_TZ } from "../utils/tz";
import { buildSpanMap } from "../utils/spanMap";
import MiniCalendar from "./MiniCalendar";
import OverflowDialog from "./OverflowDialog";
import EventPill from "./EventPill";
import LegendStrip from "./LegendStrip";
import OverflowChip from "./OverflowChip";
import WeekView from "./WeekView";
import ViewToggle from "./ViewToggle";
import type {
  CalendarEvent,
  WorkingCalendarProps,
  CalendarView,
} from "../types";
import { validateEvents, WEEKDAYS } from "../utils";
import "../css/WorkingCalendar.css";
import "../css/WeekView.css";

export default function WorkingCalendar({
  legend,
  disableDate,
  disabledDates = [],
  multiSelect = false,
  onMultiSelectDates,
  onDateClick,
  events: eventsProp = [],
  renderEvent,
  renderTooltip,
  onEventClick,
  hideLegend = false,
  calendarTimezone,
  multiSelectAddLabel = "Add",
  onMonthYearChange,
  weekView: weekViewEnabled = false,
  onViewChange,
  onWeekChange,
}: WorkingCalendarProps) {
  const today = new Date();

  // ── View state ─────────────────────────────────────────────────────────────
  const [view, setView] = useState<CalendarView>("month");

  // ── Month navigation ───────────────────────────────────────────────────────
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [showMini, setShowMini] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const monthBtnRef = useRef<HTMLButtonElement>(null);

  const applyViewDate = useCallback(
    (next: Date) => {
      setViewDate(next);
      onMonthYearChange?.(next.getMonth() + 1, next.getFullYear());
    },
    [onMonthYearChange],
  );
  // ── Week navigation ────────────────────────────────────────────────────────
  // weekDate is always a Sunday (start of the displayed week)
  const [weekDate, setWeekDate] = useState(() =>
    startOfWeek(today, { weekStartsOn: 0 }),
  );

  const applyWeekDate = useCallback(
    (next: Date) => {
      setWeekDate(next);
      if (weekViewEnabled) {
        onWeekChange?.(format(next, "yyyy-MM-dd"));
      }
    },
    [weekViewEnabled, onWeekChange],
  );

  const handleWeekPrev = useCallback(
    () => applyWeekDate(addWeeks(weekDate, -1)),
    [weekDate, applyWeekDate],
  );
  const handleWeekNext = useCallback(
    () => applyWeekDate(addWeeks(weekDate, 1)),
    [weekDate, applyWeekDate],
  );

  const handleViewChange = useCallback(
    (next: CalendarView) => {
      setView(next);
      if (next === "week") {
        const today = new Date();
        const base = isSameMonth(today, viewDate)
          ? today
          : startOfMonth(viewDate);
        applyWeekDate(startOfWeek(base, { weekStartsOn: 0 }));
      }
      onViewChange?.(next);
    },
    [onViewChange, viewDate, applyWeekDate],
  );

  // ── Validated events ───────────────────────────────────────────────────────
  const validatedEvents = useMemo(() => {
    const { valid, invalid } = validateEvents(eventsProp as unknown[]);
    if (invalid.length > 0) {
      console.warn(
        `[WorkingCalendar] ${invalid.length} event(s) failed validation and were skipped:`,
        invalid,
      );
    }
    return valid;
  }, [eventsProp]);

  // ── Disabled dates ─────────────────────────────────────────────────────────
  const disabledSet = useMemo<Set<string>>(() => {
    const all: Array<string | Date | number> = [...disabledDates];
    if (disableDate !== undefined) all.push(disableDate);
    const tz = calendarTimezone ?? LOCAL_TZ;
    return new Set(
      all.map((d) => toDateKey(d, tz)).filter((k): k is string => k !== null),
    );
  }, [disableDate, disabledDates, calendarTimezone]);

  // ── Month grid dates ───────────────────────────────────────────────────────
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const rows: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    rows.push(allDays.slice(i, i + 7));
  }

  // ── Span map (month view) ──────────────────────────────────────────────────
  const spanMap = useMemo(
    () =>
      buildSpanMap({
        events: validatedEvents,
        gridDays: allDays,
        monthStartKey: format(monthStart, "yyyy-MM-dd"),
        monthEndKey: format(monthEnd, "yyyy-MM-dd"),
        calendarTimezone,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validatedEvents, viewDate, calendarTimezone],
  );

  // ── Month handlers ─────────────────────────────────────────────────────────
  const handlePrev = () => {
    if (view === "week") {
      handleWeekPrev();
      return;
    }
    applyViewDate(addMonths(viewDate, -1));
  };
  const handleNext = () => {
    if (view === "week") {
      handleWeekNext();
      return;
    }
    applyViewDate(addMonths(viewDate, 1));
  };
  const handleToday = () => {
    applyViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    applyWeekDate(startOfWeek(today, { weekStartsOn: 0 }));
  };
  const handleMiniSelect = (month: number, year: number) =>
    applyViewDate(new Date(year, month, 1));

  const isOutside = (d: Date) => d < monthStart || d > monthEnd;

  const toggleDaySelection = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    if (disabledSet.has(key)) return;
    setSelectedDates((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleHeaderAdd = () => {
    const sorted = Array.from(selectedDates)
      .filter((k) => !disabledSet.has(k))
      .sort();
    onMultiSelectDates?.(sorted);
  };

  const clearSelection = () => setSelectedDates(new Set());

  // ── Overflow dialog ────────────────────────────────────────────────────────
  const [overflowDialog, setOverflowDialog] = useState<{
    dateKey: string;
    events: CalendarEvent[];
    anchorRef: React.RefObject<HTMLButtonElement>;
  } | null>(null);

  // ── Legend events (visible month) ─────────────────────────────────────────
  const currentMonthEvents = useMemo(() => {
    const monthStartKey = format(monthStart, "yyyy-MM-dd");
    const monthEndKey = format(monthEnd, "yyyy-MM-dd");
    return validatedEvents.filter((ev) => {
      const tz = resolveEventTz(ev.timezone, calendarTimezone);
      const key = toDateKey(ev.date, tz);
      if (!key) return false;
      const endKey = ev.endDate ? toDateKey(ev.endDate, tz) : key;
      return (
        (key >= monthStartKey && key <= monthEndKey) ||
        (endKey !== null && endKey >= monthStartKey && key <= monthEndKey)
      );
    });
  }, [validatedEvents, monthStart, monthEnd, calendarTimezone]);

  const showLegend = !hideLegend && currentMonthEvents.length > 0;

  // Build the human-friendly week label (e.g. "Mar 16 – Mar 22, 2025")
  const weekEndDay = new Date(weekDate);
  weekEndDay.setDate(weekDate.getDate() + 6);
  const weekRangeLabel =
    format(weekDate, "MMM d") + " – " + format(weekEndDay, "MMM d, yyyy");

  const MAX_VISIBLE_TRACKS = 2;

  return (
    <div className="wc-wrapper">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="wc-header-bar">
        {/* Left: view toggle (only when weekView prop is enabled) */}
        <div className="wc-header-left">
          {weekViewEnabled && (
            <ViewToggle view={view} onChange={handleViewChange} />
          )}
        </div>

        {/* Centre: navigation */}
        <div className="wc-nav">
          <button
            className="wc-nav-btn"
            onClick={handlePrev}
            aria-label={view === "week" ? "Previous week" : "Previous month"}
          >
            ‹
          </button>

          {view === "month" ? (
            <div style={{ position: "relative" }}>
              <button
                ref={monthBtnRef}
                className={`wc-month-btn${showMini ? " active" : ""}`}
                onClick={() => setShowMini((v) => !v)}
                aria-expanded={showMini}
              >
                {format(viewDate, "MMMM yyyy")}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path
                    d="M1 1l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {showMini && (
                <MiniCalendar
                  currentMonth={viewDate.getMonth()}
                  currentYear={viewDate.getFullYear()}
                  onSelect={handleMiniSelect}
                  onClose={() => setShowMini(false)}
                  anchorRef={monthBtnRef}
                />
              )}
            </div>
          ) : (
            /* Week view: show week range label (non-clickable) */
            <div className="wc-week-range-label">{weekRangeLabel}</div>
          )}

          <button
            className="wc-nav-btn"
            onClick={handleNext}
            aria-label={view === "week" ? "Next week" : "Next month"}
          >
            ›
          </button>
        </div>

        {/* Right: Today + multiselect actions */}
        <div className="wc-header-actions">
          <button className="wc-today-btn" onClick={handleToday}>
            Today
          </button>

          {multiSelect && (
            <>
              {selectedDates.size > 0 && (
                <button className="wc-clear-btn" onClick={clearSelection}>
                  Clear ({selectedDates.size})
                </button>
              )}
              <button
                className="wc-header-add-btn"
                disabled={selectedDates.size === 0}
                onClick={handleHeaderAdd}
              >
                <span className="wc-header-add-icon">+</span>
                {multiSelectAddLabel}
                {selectedDates.size > 0 && (
                  <span className="wc-add-badge">{selectedDates.size}</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Legend strip ──────────────────────────────────────────────────── */}
      {legend && (
        <div className="wc-legend-strip">
          <span className="wc-legend-strip-text">{legend}</span>
        </div>
      )}

      {/* ── Calendar body ─────────────────────────────────────────────────── */}
      <div className="wc-calendar">
        {view === "month" ? (
          <>
            {/* Day headers */}
            <div className="wc-day-headers">
              {WEEKDAYS.map((d, i) => (
                <div
                  key={d}
                  className={`wc-day-header${i === 0 || i === 6 ? " weekend" : ""}`}
                >
                  <span className="wc-day-full">{d}</span>
                  <span className="wc-day-short">{d.charAt(0)}</span>
                </div>
              ))}
            </div>

            {/* Month grid */}
            <div className="wc-grid">
              {rows.map((row, rowIdx) =>
                row.map((day) => {
                  const outside = isOutside(day);
                  const weekend = isWeekend(day);
                  const todayCell = isToday(day);
                  const isLastRow = rowIdx === rows.length - 1;
                  const weekNum = getWeek(day);
                  const dayOfWeek = getDay(day);
                  const showWeek = dayOfWeek === 0;
                  const dayKey = format(day, "yyyy-MM-dd");
                  const isDisabled = !outside && disabledSet.has(dayKey);
                  const isSelected = multiSelect && selectedDates.has(dayKey);

                  const cellSegments = outside
                    ? []
                    : (spanMap.get(dayKey) ?? []);
                  const anchorSegments = cellSegments.filter((s) =>
                    ["solo", "start", "firstVisible"].includes(s.role),
                  );
                  const continuationSegments = cellSegments.filter((s) =>
                    ["mid", "end"].includes(s.role),
                  );
                  const visibleTracks = new Set(
                    anchorSegments
                      .slice(0, MAX_VISIBLE_TRACKS)
                      .map((s) => s.track),
                  );
                  const visibleSegments = cellSegments.filter((s) =>
                    visibleTracks.has(s.track),
                  );
                  const hiddenAnchorSegments =
                    anchorSegments.slice(MAX_VISIBLE_TRACKS);
                  const hiddenEvents = [
                    ...hiddenAnchorSegments.map((s) => s.event),
                    ...continuationSegments
                      .filter((s) => !visibleTracks.has(s.track))
                      .map((s) => s.event),
                  ].filter(
                    (ev, i, arr) => arr.findIndex((e) => e.id === ev.id) === i,
                  );
                  const allCellEvents = cellSegments
                    .map((s) => s.event)
                    .filter(
                      (ev, i, arr) =>
                        arr.findIndex((e) => e.id === ev.id) === i,
                    );
                  const isOverflowAnchor =
                    hiddenEvents.length > 0 &&
                    hiddenAnchorSegments.some((s) => s.isOverflowAnchor);
                  const hasEvents = anchorSegments.length > 0;

                  return (
                    <div
                      key={day.toISOString()}
                      className={[
                        "wc-cell",
                        outside ? "outside" : "",
                        weekend && !outside ? "weekend-cell" : "",
                        todayCell ? "today" : "",
                        isLastRow ? "last-row" : "",
                        isDisabled ? "disabled" : "",
                        multiSelect && !outside && !isDisabled
                          ? "selectable"
                          : "",
                        isSelected ? "selected" : "",
                        hasEvents ? "has-events" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => {
                        if (multiSelect && !outside && !isDisabled)
                          toggleDaySelection(day);
                      }}
                    >
                      <div className="wc-cell-top">
                        <span className="wc-day-num">{format(day, "d")}</span>
                        {!multiSelect &&
                          !outside &&
                          !isDisabled &&
                          onDateClick && (
                            <button
                              className={`wc-add-btn${hasEvents ? " wc-edit-btn" : ""}`}
                              aria-label={
                                hasEvents
                                  ? `Edit events on ${format(day, "PPP")}`
                                  : `Add event on ${format(day, "PPP")}`
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                onDateClick(dayKey);
                              }}
                            >
                              {hasEvents ? (
                                <svg
                                  width="11"
                                  height="11"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                >
                                  <path
                                    d="M8.5 1.5a1.414 1.414 0 0 1 2 2L3.5 10.5l-3 .5.5-3L8.5 1.5z"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                "+"
                              )}
                            </button>
                          )}
                        {isSelected && (
                          <span className="wc-check-tick" aria-hidden="true">
                            ✓
                          </span>
                        )}
                      </div>

                      {visibleSegments.length > 0 && (
                        <div className="wc-events">
                          {visibleSegments.map((seg) => (
                            <EventPill
                              key={`${seg.event.id}-${dayKey}`}
                              event={seg.event}
                              trackIndex={seg.track}
                              dateKey={dayKey}
                              spanRole={seg.role}
                              cellsRemainingInRow={seg.cellsRemainingInRow}
                              renderEvent={renderEvent}
                              renderTooltip={renderTooltip}
                              onEventClick={onEventClick}
                              calendarTimezone={calendarTimezone}
                            />
                          ))}
                        </div>
                      )}

                      {isOverflowAnchor && (
                        <OverflowChip
                          dayKey={dayKey}
                          hiddenCount={hiddenEvents.length}
                          allCellEvents={allCellEvents}
                          onOpen={(ref) =>
                            setOverflowDialog({
                              dateKey: dayKey,
                              events: allCellEvents,
                              anchorRef: ref,
                            })
                          }
                        />
                      )}

                      {isDisabled && (
                        <span className="wc-disabled-line" aria-hidden="true" />
                      )}
                      {showWeek && !outside && (
                        <span className="wc-week-badge">W{weekNum}</span>
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </>
        ) : (
          /* ── Week view ───────────────────────────────────────────────── */
          <WeekView
            weekDate={weekDate}
            events={validatedEvents}
            calendarTimezone={calendarTimezone}
            onEventClick={onEventClick}
            renderTooltip={renderTooltip}
          />
        )}
      </div>

      {/* Dynamic event legend strip */}
      {showLegend && view === "month" && (
        <LegendStrip events={currentMonthEvents} />
      )}

      {/* Overflow dialog */}
      {overflowDialog && (
        <OverflowDialog
          dateKey={overflowDialog.dateKey}
          events={overflowDialog.events}
          anchorRef={overflowDialog.anchorRef}
          onClose={() => setOverflowDialog(null)}
          onEventClick={onEventClick}
          renderTooltip={renderTooltip}
          calendarTimezone={calendarTimezone}
        />
      )}
    </div>
  );
}
