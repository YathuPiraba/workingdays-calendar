import { useEffect, useRef, useState } from "react";
import type { CalendarEvent, OverflowDialogProps } from "../types";
import { DEFAULT_COLOR, formatDateLabel } from "../utils";
import "../css/OverflowDialog.css";
import DefaultDetail from "./DefaultDetail";

export default function OverflowDialog({
  dateKey,
  events,
  anchorRef,
  onClose,
  onEventClick,
  renderTooltip,
  calendarTimezone,
  eventActionLabel,
}: OverflowDialogProps) {
  const [activeId, setActiveId] = useState<string>(events[0]?.id ?? "");
  const [position, setPosition] = useState<React.CSSProperties>({});
  const dialogRef = useRef<HTMLDivElement>(null);

  const activeEvent = events.find((e) => e.id === activeId) ?? events[0];

  // Position the dialog near the overflow chip anchor
  useEffect(() => {
    if (!anchorRef.current || !dialogRef.current) return;
    const anchor = anchorRef.current.getBoundingClientRect();
    const dialog = dialogRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = anchor.bottom + 8;
    let left = anchor.left;

    // Flip up if not enough space below
    if (top + dialog.height > vh - 16) {
      top = anchor.top - dialog.height - 8;
    }
    // Shift left if overflows right edge
    if (left + dialog.width > vw - 16) {
      left = vw - dialog.width - 16;
    }
    if (left < 8) left = 8;

    setPosition({ top, left });
  }, [anchorRef]);

  // Close on outside click or Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const handleEventActivate = (ev: CalendarEvent) => {
    setActiveId(ev.id);
  };

  return (
    <>
      {/* Backdrop (transparent, just catches outside clicks) */}
      <div className="wc-od-backdrop" onClick={onClose} />

      <div
        ref={dialogRef}
        className="wc-od-book"
        style={position}
        role="dialog"
        aria-modal="true"
        aria-label={`Events for ${dateKey}`}
      >
        {/* Book spine / left page — event list */}
        <div className="wc-od-spine">
          <div className="wc-od-spine-header">
            <span className="wc-od-date-label">{formatDateLabel(dateKey)}</span>
            <span className="wc-od-count">{events.length} events</span>
          </div>

          <ul className="wc-od-list" role="listbox" aria-label="Event list">
            {events.map((ev) => {
              const color = ev.color ?? DEFAULT_COLOR;
              const isActive = ev.id === activeId;
              return (
                <li
                  key={ev.id}
                  role="option"
                  aria-selected={isActive}
                  className={`wc-od-list-item${isActive ? " active" : ""}`}
                  onMouseEnter={() => handleEventActivate(ev)}
                >
                  <span
                    className="wc-od-bullet"
                    style={{ background: color }}
                  />
                  <span className="wc-od-item-label">{ev.label}</span>
                  {isActive && (
                    <span className="wc-od-item-arrow" aria-hidden="true">
                      ›
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Book page crease */}
        <div className="wc-od-crease" aria-hidden="true" />

        {/* Right page — event detail */}
        <div className="wc-od-page" key={activeEvent?.id}>
          {activeEvent ? (
            renderTooltip ? (
              <div className="wc-od-custom-detail">
                {renderTooltip(activeEvent)}
              </div>
            ) : (
              <DefaultDetail
                event={activeEvent}
                onEventClick={onEventClick}
                calendarTimezone={calendarTimezone}
                eventActionLabel={eventActionLabel}
              />
            )
          ) : (
            <div className="wc-od-empty">No event selected</div>
          )}
        </div>

        {/* Close button */}
        <button
          className="wc-od-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>
    </>
  );
}
