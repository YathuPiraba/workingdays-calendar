import type { CalendarEvent } from "../types";
import { DEFAULT_COLOR } from "../utils";
import { formatInTz, getUtcOffset, resolveEventTz } from "../utils/tz";

export default function DefaultTooltip({
  event,
  calendarTimezone,
}: {
  event: CalendarEvent;
  calendarTimezone?: string;
}) {
  const color = event.color ?? DEFAULT_COLOR;
  const tz = resolveEventTz(event.timezone, calendarTimezone);
  const showTz = Boolean(event.timezone || calendarTimezone);
  const utcOffset = showTz ? getUtcOffset(tz) : null;
  console.log(tz);

  console.log(utcOffset);

  const timeStr =
    typeof event.date === "string" && event.date.includes("T")
      ? formatInTz(event.date, tz, "MMM d, yyyy · h:mm a")
      : null;

  // Show date range if multi-day
  const endDateStr =
    event.endDate && typeof event.endDate === "string" ? event.endDate : null;

  return (
    <div className="wc-tooltip-inner">
      <div className="wc-tooltip-header">
        <span className="wc-tooltip-dot" style={{ background: color }} />
        <span className="wc-tooltip-title">{event.label}</span>
      </div>

      {showTz && (
        <div className="wc-tooltip-tz">
          <span className="wc-tooltip-tz-name" title={tz}>
            {tz}
          </span>
          {utcOffset && (
            <span className="wc-tooltip-tz-offset">{utcOffset}</span>
          )}
        </div>
      )}

      {timeStr && <div className="wc-tooltip-time">{timeStr}</div>}

      {/* Date range row */}
      {endDateStr && (
        <div className="wc-tooltip-time">
          {typeof event.date === "string"
            ? event.date.slice(0, 10)
            : String(event.date)}{" "}
          → {endDateStr.slice(0, 10)}
        </div>
      )}

      {event.data && Object.keys(event.data).length > 0 && (
        <dl className="wc-tooltip-data">
          {Object.entries(event.data).map(([key, val]) => (
            <div className="wc-tooltip-row" key={key}>
              <dt className="wc-tooltip-key">{key}</dt>
              <dd className="wc-tooltip-val">
                {typeof val === "object" ? JSON.stringify(val) : String(val)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
