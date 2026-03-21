import { useMemo, useRef } from "react";
import type { PositionedEvent, WeekViewProps } from "../types";
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

export default function WeekView({
  weekDate,
  events,
  calendarTimezone,
  onEventClick,
  renderTooltip,
}: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const tz =
    calendarTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

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

  const bannerRows =
    bannerEntries.length > 0
      ? Math.max(...bannerEntries.map((e) => e.row)) + 1
      : 0;
  // 26px per row + 8px top/bottom padding
  const bannerHeight = bannerRows > 0 ? bannerRows * 26 + 8 : 0;

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
      {bannerRows > 0 && (
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
            style={{ gridTemplateRows: `repeat(${bannerRows}, 26px)` }}
          >
            {/* Column shading (today highlight + borders) */}
            {days.map((day, colIdx) => (
              <div
                key={day.toISOString()}
                className={`wc-week-allday-col${isToday(day) ? " today" : ""}`}
                style={{
                  gridColumn: colIdx + 1,
                  gridRow: `1 / ${bannerRows + 1}`,
                }}
              />
            ))}

            {/* Pill for each all-day event */}
            {bannerEntries.map((entry) => (
              <AllDayPill
                key={`${entry.event.id}-banner`}
                entry={entry}
                onEventClick={onEventClick}
                calendarTimezone={calendarTimezone}
                renderTooltip={renderTooltip}
              />
            ))}
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
    </div>
  );
}
