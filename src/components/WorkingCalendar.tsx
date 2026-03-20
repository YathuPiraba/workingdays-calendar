import { useRef, useMemo, useState } from "react";
import {
  addMonths,
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
} from "date-fns";
import { toDateKey, resolveEventTz, LOCAL_TZ } from "../utils/tz";
import MiniCalendar from "./MiniCalendar";
import OverflowDialog from "./OverflowDialog";
import EventPill from "./EventPill";
import LegendStrip from "./LegendStrip";
import OverflowChip from "./OverflowChip";
import type { CalendarEvent, WorkingCalendarProps } from "../types";
import { validateEvents, WEEKDAYS } from "../utils";
import "../css/WorkingCalendar.css";

export default function WorkingCalendar({
  legend,
  disableDate,
  disabledDates = [],
  multiSelect = false,
  onMultiSelect,
  onDateClick,
  events: eventsProp = [],
  maxVisibleEvents = 2,
  renderEvent,
  renderTooltip,
  onEventClick,
  hideLegend = false,
  calendarTimezone,
  eventActionLabel,
}: WorkingCalendarProps = {}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [showMini, setShowMini] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const monthBtnRef = useRef<HTMLButtonElement>(null);

  // Validate events at runtime
  const validatedEvents = useMemo(() => {
    const { valid, invalid } = validateEvents(eventsProp as unknown[]);
    if (invalid.length > 0 && import.meta.env.MODE !== "production") {
      console.warn(
        `[WorkingCalendar] ${invalid.length} event(s) failed validation and were skipped:`,
        invalid,
      );
    }
    return valid;
  }, [eventsProp]);

  // Group events by date key, sorted by priority desc
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of validatedEvents) {
      const tz = resolveEventTz(ev.timezone, calendarTimezone);
      const key = toDateKey(ev.date, tz);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    for (const [key, bucket] of map) {
      map.set(
        key,
        [...bucket].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
      );
    }
    return map;
  }, [validatedEvents]);

  const disabledSet = useMemo<Set<string>>(() => {
    const all: Array<string | Date | number> = [...disabledDates];
    if (disableDate !== undefined) all.push(disableDate);
    // Disabled dates use calendarTimezone (no per-date timezone on disabled entries)
    const tz = calendarTimezone ?? LOCAL_TZ;
    return new Set(
      all.map((d) => toDateKey(d, tz)).filter((k): k is string => k !== null),
    );
  }, [disableDate, disabledDates, calendarTimezone]);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const rows: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    rows.push(allDays.slice(i, i + 7));
  }

  const handlePrev = () => setViewDate((d) => addMonths(d, -1));
  const handleNext = () => setViewDate((d) => addMonths(d, 1));
  const handleToday = () =>
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const handleMiniSelect = (month: number, year: number) =>
    setViewDate(new Date(year, month, 1));
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
    onMultiSelect?.(sorted);
  };

  const clearSelection = () => setSelectedDates(new Set());

  // Overflow dialog state
  const [overflowDialog, setOverflowDialog] = useState<{
    dateKey: string;
    events: CalendarEvent[];
    anchorRef: React.RefObject<HTMLButtonElement>;
  } | null>(null);

  // Filter events to only those within the currently viewed month (for legend)
  const currentMonthEvents = useMemo(() => {
    const monthStartKey = format(monthStart, "yyyy-MM-dd");
    const monthEndKey = format(monthEnd, "yyyy-MM-dd");
    return validatedEvents.filter((ev) => {
      const tz = resolveEventTz(ev.timezone, calendarTimezone);
      const key = toDateKey(ev.date, tz);
      if (!key) return false;
      return key >= monthStartKey && key <= monthEndKey;
    });
  }, [validatedEvents, monthStart, monthEnd, calendarTimezone]);

  const showLegend = !hideLegend && currentMonthEvents.length > 0;

  return (
    <div className="wc-wrapper">
      {/* Header */}
      <div className="wc-header-bar">
        <span className="wc-title">{legend ?? ""}</span>

        <div className="wc-nav">
          <button
            className="wc-nav-btn"
            onClick={handlePrev}
            aria-label="Previous month"
          >
            ‹
          </button>

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

          <button
            className="wc-nav-btn"
            onClick={handleNext}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

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
                Add
                {selectedDates.size > 0 && (
                  <span className="wc-add-badge">{selectedDates.size}</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="wc-calendar">
        <div className="wc-day-headers">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={`wc-day-header${i === 0 || i === 6 ? " weekend" : ""}`}
            >
              {d}
            </div>
          ))}
        </div>

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
              const cellEvents = outside
                ? []
                : (eventsByDate.get(dayKey) ?? []);
              const hasEvents = cellEvents.length > 0;
              const visibleEvents = cellEvents.slice(0, maxVisibleEvents);
              const hiddenEvents = cellEvents.slice(maxVisibleEvents);

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
                    multiSelect && !outside && !isDisabled ? "selectable" : "",
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
                  {/* Day number + add/edit button row */}
                  <div className="wc-cell-top">
                    <span className="wc-day-num">{format(day, "d")}</span>

                    {!multiSelect && !outside && !isDisabled && onDateClick && (
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
                            xmlns="http://www.w3.org/2000/svg"
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

                  {/* Event track pills */}
                  {visibleEvents.length > 0 && (
                    <div className="wc-events">
                      {visibleEvents.map((ev, trackIndex) => (
                        <EventPill
                          key={ev.id}
                          event={ev}
                          trackIndex={trackIndex}
                          dateKey={dayKey}
                          renderEvent={renderEvent}
                          renderTooltip={renderTooltip}
                          onEventClick={onEventClick}
                          calendarTimezone={calendarTimezone}
                        />
                      ))}
                    </div>
                  )}

                  {/* Overflow chip */}
                  {hiddenEvents.length > 0 && (
                    <OverflowChip
                      dayKey={dayKey}
                      hiddenCount={hiddenEvents.length}
                      allCellEvents={cellEvents}
                      onOpen={(ref) =>
                        setOverflowDialog({
                          dateKey: dayKey,
                          events: cellEvents,
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
      </div>

      {/* Dynamic event legend */}
      {showLegend && <LegendStrip events={currentMonthEvents} />}

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
          eventActionLabel={eventActionLabel}
        />
      )}
    </div>
  );
}
