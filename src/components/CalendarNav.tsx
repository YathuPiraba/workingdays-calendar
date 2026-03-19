import React from "react";
import "./Calendar.css";

interface CalendarNavProps {
  activeTab: "event" | "holiday" | "custom-weekend" | "non-leave-day";
  onTabChange: (
    tab: "event" | "holiday" | "custom-weekend" | "non-leave-day",
  ) => void;
  onMultiSelectToggle: () => void;
  multiSelectMode: boolean;
  selectedDatesCount: number;
  onMultiSelectDone: () => void;
}

/**
 * Navigation bar inside calendar for switching between event types
 */
export const CalendarNav: React.FC<CalendarNavProps> = ({
  activeTab,
  onTabChange,
  onMultiSelectToggle,
  multiSelectMode,
  selectedDatesCount,
  onMultiSelectDone,
}) => {
  const tabs: Array<{
    id: "event" | "holiday" | "custom-weekend" | "non-leave-day";
    label: string;
    icon: string;
  }> = [
    { id: "event", label: "Events", icon: "📅" },
    { id: "holiday", label: "Holidays", icon: "🎉" },
    { id: "custom-weekend", label: "Custom Weekend", icon: "🏖️" },
    { id: "non-leave-day", label: "Non-Leave Days", icon: "✓" },
  ];

  return (
    <div className="calendar-nav">
      <div className="nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
          >
            <span className="nav-tab-icon">{tab.icon}</span>
            <span className="nav-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="nav-actions">
        {multiSelectMode ? (
          <div className="multi-select-info">
            <span className="selected-count">
              {selectedDatesCount} dates selected
            </span>
            {selectedDatesCount > 0 && (
              <>
                <button
                  className="action-btn action-apply"
                  onClick={onMultiSelectDone}
                  title="Apply action to selected dates"
                >
                  Apply
                </button>
              </>
            )}
            <button
              className="action-btn action-cancel"
              onClick={onMultiSelectToggle}
              title="Cancel multi-select"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="action-btn action-multi-select"
            onClick={onMultiSelectToggle}
            title="Select multiple dates"
          >
            📍 Multi-Select
          </button>
        )}
      </div>
    </div>
  );
};

export default CalendarNav;
