import type { CalendarEvent } from "../types";
import { DEFAULT_COLOR } from "../utils";
import {
  formatInTz,
  getUtcOffset,
  resolveEventTz,
  LOCAL_TZ,
} from "../utils/tz";

export default function DefaultDetail({
  event,
  onEventClick,
  calendarTimezone,
  eventActionLabel = "Open event",
}: {
  event: CalendarEvent;
  onEventClick?: (event: CalendarEvent) => void;
  calendarTimezone?: string;
  eventActionLabel?: string;
}) {
  const color = event.color ?? DEFAULT_COLOR;
  const tz = resolveEventTz(event.timezone, calendarTimezone);
  const showTz = tz !== LOCAL_TZ || event.timezone;
  const utcOffset = showTz ? getUtcOffset(tz) : null;
  const timeStr =
    typeof event.date === "string" && event.date.includes("T")
      ? formatInTz(event.date, tz, "MMM d, yyyy · h:mm a")
      : null;

  return (
    <div className="wc-od-detail">
      {/* Color bar accent */}
      <div className="wc-od-detail-accent" style={{ background: color }} />

      <div className="wc-od-detail-body">
        {/* Title */}
        <div className="wc-od-detail-title-row">
          <span className="wc-od-detail-dot" style={{ background: color }} />
          <h3 className="wc-od-detail-title">{event.label}</h3>
        </div>

        {/* Timezone badge */}
        {showTz && (
          <div className="wc-od-tz-badge">
            <span className="wc-od-tz-name">{tz}</span>
            {utcOffset && <span className="wc-od-tz-offset">{utcOffset}</span>}
          </div>
        )}

        {/* Formatted time */}
        {timeStr && <div className="wc-od-time">{timeStr}</div>}

        {/* Data fields */}
        {event.data && Object.keys(event.data).length > 0 ? (
          <dl className="wc-od-detail-data">
            {Object.entries(event.data).map(([key, val]) => (
              <div className="wc-od-detail-row" key={key}>
                <dt className="wc-od-detail-key">{key}</dt>
                <dd className="wc-od-detail-val">
                  {typeof val === "object" ? JSON.stringify(val) : String(val)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="wc-od-detail-empty">No additional details</p>
        )}

        {/* User-facing click action */}
        {onEventClick && (
          <button
            className="wc-od-detail-action"
            style={{ borderColor: color, color }}
            onClick={() => onEventClick(event)}
          >
            {eventActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
