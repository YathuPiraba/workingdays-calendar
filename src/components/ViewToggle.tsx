import type { CalendarView } from "../types";

interface ViewToggleProps {
  view: CalendarView;
  onChange: (view: CalendarView) => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="wc-view-toggle" role="tablist" aria-label="Calendar view">
      <button
        role="tab"
        aria-selected={view === "month"}
        className={`wc-view-tab${view === "month" ? " active" : ""}`}
        onClick={() => onChange("month")}
      >
        Month
      </button>
      <button
        role="tab"
        aria-selected={view === "week"}
        className={`wc-view-tab${view === "week" ? " active" : ""}`}
        onClick={() => onChange("week")}
      >
        Week
      </button>
      {/* Sliding indicator */}
      <span
        className="wc-view-indicator"
        style={{ transform: `translateX(${view === "week" ? "100%" : "0%"})` }}
        aria-hidden="true"
      />
    </div>
  );
}
