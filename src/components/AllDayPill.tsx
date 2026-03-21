import { useCallback, useRef, useState } from "react";
import type { BannerEntry, CalendarEvent } from "../types";
import { DEFAULT_COLOR, getForegroundColor } from "../utils";
import DefaultTooltip from "./DefaultTooltip";
import TooltipPortal from "./TooltipPortal";
import { useTooltipPosition } from "../hooks/useTooltipPosition";

export default function AllDayPill({
  entry,
  onEventClick,
  calendarTimezone,
  renderTooltip,
}: {
  entry: BannerEntry;
  onEventClick?: (event: CalendarEvent) => void;
  calendarTimezone?: string;
  renderTooltip?: (event: CalendarEvent) => React.ReactNode;
}) {
  const { event, startCol, colSpan, row } = entry;
  const color = event.color ?? DEFAULT_COLOR;
  const fg = getForegroundColor(color);

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
        className="wc-week-allday-pill"
        style={{
          gridColumn: `${startCol + 1} / span ${colSpan}`,
          gridRow: row + 1,
          background: color,
          color: fg,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          onEventClick?.(event);
          event.onClick?.(event);
        }}
      >
        <span className="wc-week-allday-pill-label">{event.label}</span>
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
