// WeekEventPill.tsx
import { useCallback, useRef, useState } from "react";
import { format } from "date-fns";
import type { CalendarEvent, PositionedEvent } from "../types";
import { DEFAULT_COLOR, getForegroundColor, toFractionalHour } from "../utils";
import DefaultTooltip from "./DefaultTooltip";
import TooltipPortal from "./TooltipPortal";
import { useTooltipPosition } from "../hooks/useTooltipPosition";

export default function WeekEventPill({
  positioned,
  onEventClick,
  calendarTimezone,
  renderTooltip,
}: {
  positioned: PositionedEvent;
  onEventClick?: (event: CalendarEvent) => void;
  calendarTimezone?: string;
  renderTooltip?: (event: CalendarEvent) => React.ReactNode;
}) {
  const { event, top, height, column, totalColumns } = positioned;
  const color = event.color ?? DEFAULT_COLOR;
  const fg = getForegroundColor(color);

  const colWidth = 100 / totalColumns;
  const left = `${column * colWidth}%`;
  const width = `calc(${colWidth}% - 3px)`;

  const startHour = toFractionalHour(event.date);
  const h = Math.floor(startHour);
  const m = Math.round((startHour - h) * 60);
  const timeLabel = format(new Date(2000, 0, 1, h, m), "h:mm a");

  const [tooltipOpen, setTooltipOpen] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => setTooltipOpen(true), []);
  const handleMouseLeave = useCallback(() => setTooltipOpen(false), []);

  const tooltipStyle = useTooltipPosition(tooltipOpen, pillRef, tooltipRef);

  const tooltipContent = renderTooltip ? (
    renderTooltip(event)
  ) : (
    <DefaultTooltip event={event} calendarTimezone={calendarTimezone} />
  );

  return (
    <>
      <div
        ref={pillRef}
        className="wc-week-event"
        style={{ top, height, left, width, background: color, color: fg }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          onEventClick?.(event);
          event.onClick?.(event);
        }}
      >
        <span className="wc-week-event-label">{event.label}</span>
        {height >= 36 && (
          <span className="wc-week-event-time">{timeLabel}</span>
        )}
      </div>

      <TooltipPortal open={tooltipOpen}>
        <div
          ref={tooltipRef}
          className="wc-tooltip"
          style={tooltipStyle}
          role="tooltip"
        >
          {tooltipContent}
        </div>
      </TooltipPortal>
    </>
  );
}
