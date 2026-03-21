import { useMemo, useRef, useState } from "react";
import type { PositionedEvent, WeekViewProps, CalendarEvent } from "../types";
import { format, addDays, startOfWeek, isToday } from "date-fns";
import {
  AXIS_HOURS,
  buildBannerEntries,
  GRID_HEIGHT,
  HOUR_HEIGHT,
  positionTimedEvents,
  START_HOUR,
} from "../utils";
import WeekEventPill from "./WeekEventPill";
import AllDayPill from "./AllDayPill";
import OverflowChip from "./OverflowChip";
import OverflowDialog from "./OverflowDialog";

const MAX_BANNER_ROWS = 2;

export default function WeekView({
  weekDate,
  events,
  calendarTimezone,
  onEventClick,
  renderTooltip,
  eventActionLabel,
}: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const tz =
    calendarTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  // ── Overflow dialog state ────────────────────────────────────────────────
  const [overflowDialog, setOverflowDialog] = useState<{
    dateKey: string;
    events: CalendarEvent[];
    anchorRef: React.RefObject<HTMLButtonElement>;
  } | null>(null);

  // Timed events per day
  const timedByDay = useMemo(() => {
    const map = new Map<string, PositionedEvent[]>();
    for (const day of days) {
      const key = format(day, "yyyy-MM-dd");
      map.set(key, positionTimedEvents(events, key, tz));
    }
    return map;
  }, [events, days, tz]);

  // All-day banner entries
  const bannerEntries = useMemo(
    () => buildBannerEntries(events, days, tz),
    [events, days, tz],
  );

  // ── Split banner into visible (row < MAX) and hidden (row >= MAX) ────────
  const visibleBannerEntries = useMemo(
    () => bannerEntries.filter((e) => e.row < MAX_BANNER_ROWS),
    [bannerEntries],
  );

  // Map from column index → hidden events for that column
  const hiddenByCol = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const entry of bannerEntries) {
      if (entry.row < MAX_BANNER_ROWS) continue;
      // The entry spans startCol .. startCol+colSpan-1
      for (
        let col = entry.startCol;
        col < entry.startCol + entry.colSpan;
        col++
      ) {
        const existing = map.get(col) ?? [];
        // Deduplicate by event id
        if (!existing.some((e) => e.id === entry.event.id)) {
          existing.push(entry.event);
        }
        map.set(col, existing);
      }
    }
    return map;
  }, [bannerEntries]);

  // All events visible in each column (for passing to OverflowDialog)
  const allEventsByCol = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const entry of bannerEntries) {
      for (
        let col = entry.startCol;
        col < entry.startCol + entry.colSpan;
        col++
      ) {
        const existing = map.get(col) ?? [];
        if (!existing.some((e) => e.id === entry.event.id)) {
          existing.push(entry.event);
        }
        map.set(col, existing);
      }
    }
    return map;
  }, [bannerEntries]);

  const visibleRows =
    visibleBannerEntries.length > 0
      ? Math.max(...visibleBannerEntries.map((e) => e.row)) + 1
      : 0;

  // Also account for space needed by overflow chips row
  const hasAnyOverflow = hiddenByCol.size > 0;
  const chipRowHeight = hasAnyOverflow ? 24 : 0;

  // 26px per visible row + 8px top/bottom padding + chip row
  const bannerHeight =
    visibleRows > 0 || hasAnyOverflow
      ? visibleRows * 26 + 8 + chipRowHeight
      : 0;

  // Current time
  const now = new Date();
  const nowTop =
    (now.getHours() + now.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT;

  return (
    <div className="wc-week-view">
      {/* ── Day column headers ───────────────────────────────────────────── */}
      <div className="wc-week-header">
        <div className="wc-week-gutter-header" />
        {days.map((day) => {
          const isT = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`wc-week-day-header${isT ? " today" : ""}`}
            >
              <span className="wc-week-day-name">
                {format(day, "EEE").toUpperCase()}
              </span>
              <span className={`wc-week-day-num${isT ? " today-num" : ""}`}>
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── All-day banner ───────────────────────────────────────────────── */}
      {bannerHeight > 0 && (
        <div
          className="wc-week-allday-banner"
          style={{ minHeight: bannerHeight }}
        >
          {/* Gutter label */}
          <div className="wc-week-allday-gutter">
            <span className="wc-week-allday-label">all-day</span>
          </div>

          {/* 7-column CSS grid for pills */}
          <div
            className="wc-week-allday-grid"
            style={{
              gridTemplateRows:
                visibleRows > 0
                  ? `repeat(${visibleRows}, 26px)${hasAnyOverflow ? " 24px" : ""}`
                  : hasAnyOverflow
                    ? "24px"
                    : undefined,
            }}
          >
            {/* Column shading (today highlight + borders) */}
            {days.map((day, colIdx) => (
              <div
                key={day.toISOString()}
                className={`wc-week-allday-col${isToday(day) ? " today" : ""}`}
                style={{
                  gridColumn: colIdx + 1,
                  gridRow: `1 / ${visibleRows + (hasAnyOverflow ? 2 : 1)}`,
                }}
              />
            ))}

            {/* Visible all-day pills */}
            {visibleBannerEntries.map((entry) => (
              <AllDayPill
                key={`${entry.event.id}-banner`}
                entry={entry}
                onEventClick={onEventClick}
                calendarTimezone={calendarTimezone}
                renderTooltip={renderTooltip}
              />
            ))}

            {/* Overflow chips — one per column that has hidden events */}
            {days.map((day, colIdx) => {
              const hidden = hiddenByCol.get(colIdx);
              if (!hidden || hidden.length === 0) return null;
              const allForCol = allEventsByCol.get(colIdx) ?? hidden;
              return (
                <div
                  key={`overflow-${colIdx}`}
                  style={{
                    gridColumn: colIdx + 1,
                    gridRow: visibleRows + 1,
                    display: "flex",
                    alignItems: "center",
                    padding: "2px 4px",
                  }}
                >
                  <OverflowChip
                    dayKey={format(day, "yyyy-MM-dd")}
                    hiddenCount={hidden.length}
                    allCellEvents={allForCol}
                    onOpen={(ref) =>
                      setOverflowDialog({
                        dateKey: format(day, "yyyy-MM-dd"),
                        events: allForCol,
                        anchorRef: ref,
                      })
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Scrollable time grid ─────────────────────────────────────────── */}
      <div className="wc-week-scroll" ref={scrollRef}>
        <div className="wc-week-grid-inner">
          {/* Time gutter */}
          <div className="wc-week-time-gutter">
            {AXIS_HOURS.map((h) => (
              <div
                key={h}
                className="wc-week-hour-label"
                style={{ height: HOUR_HEIGHT }}
              >
                {h === 0 ? "" : format(new Date(2000, 0, 1, h), "h a")}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const isT = isToday(day);
            const timedEvents = timedByDay.get(dayKey) ?? [];

            return (
              <div
                key={dayKey}
                className={`wc-week-day-col${isT ? " today" : ""}`}
                style={{ height: GRID_HEIGHT }}
              >
                {AXIS_HOURS.map((h) => (
                  <div
                    key={h}
                    className="wc-week-hour-row"
                    style={{
                      top: (h - START_HOUR) * HOUR_HEIGHT,
                      height: HOUR_HEIGHT,
                    }}
                  />
                ))}
                {AXIS_HOURS.map((h) => (
                  <div
                    key={`half-${h}`}
                    className="wc-week-half-row"
                    style={{
                      top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                    }}
                  />
                ))}
                {isT && (
                  <div className="wc-week-now-line" style={{ top: nowTop }}>
                    <span className="wc-week-now-dot" />
                  </div>
                )}
                {timedEvents.map((p) => (
                  <WeekEventPill
                    key={p.event.id}
                    positioned={p}
                    onEventClick={onEventClick}
                    calendarTimezone={calendarTimezone}
                    renderTooltip={renderTooltip}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Overflow dialog ──────────────────────────────────────────────── */}
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
