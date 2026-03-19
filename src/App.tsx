import { useState } from "react";
import WorkingCalendar, {
  type CalendarDataItem,
} from "./components/WorkingCalendar";
import "./App.css";

function App() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedItems, setSelectedItems] = useState<CalendarDataItem[]>([]);

  // Sample calendar data - holidays, leaves, events
  const calendarData: CalendarDataItem[] = [
    // Company Holidays
    {
      date: "2024-01-25",
      type: "holiday",
      label: "Poya Day",
      color: "#7B2CBF",
      description: "Buddhist Full Moon Day",
    },
    {
      date: "2024-02-04",
      type: "holiday",
      label: "Independence Day",
      color: "#DC3545",
      description: "Sri Lanka Independence Day",
    },
    {
      date: "2024-02-05",
      type: "holiday",
      label: "Independence Day (Observed)",
      color: "#DC3545",
      description: "Holiday observed",
    },
    {
      date: "2024-03-08",
      type: "holiday",
      label: "Maha Shivaratri",
      color: "#FF006E",
      description: "Hindu Festival",
    },

    // Employee Leaves
    {
      date: "2024-01-08",
      type: "leave",
      label: "John - Vacation",
      color: "#0096FF",
      description: "Employee on vacation",
    },
    {
      date: "2024-01-09",
      type: "leave",
      label: "John - Vacation",
      color: "#0096FF",
      description: "Employee on vacation",
    },
    {
      date: "2024-01-10",
      type: "leave",
      label: "John - Vacation",
      color: "#0096FF",
      description: "Employee on vacation",
    },
    {
      date: "2024-01-15",
      type: "leave",
      label: "Jane - Sick Leave",
      color: "#FF6B6B",
      description: "Sick leave",
    },

    // Events
    {
      date: "2024-01-20",
      type: "event",
      label: "Team Meeting",
      color: "#28A745",
      description: "Weekly team sync",
    },
    {
      date: "2024-01-22",
      type: "event",
      label: "Project Review",
      color: "#28A745",
      description: "Project deadline review",
    },
  ];

  // Color mapping
  const colors: Record<string, string> = {
    holiday: "#DC3545",
    leave: "#0096FF",
    event: "#28A745",
    weekend: "#E9ECEF",
    working: "#FFFFFF",
  };

  // Handle date selection
  const handleDateClick = (date: Date, items: CalendarDataItem[]) => {
    setSelectedDate(date);
    setSelectedItems(items);
    console.log("Date clicked:", date, "Items:", items);
  };

  // Handle date change (month navigation)
  const handleChange = (date: Date) => {
    console.log("Month changed to:", date);
  };

  // Handle selection
  const handleSelect = (date: Date) => {
    console.log("Date selected:", date);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🗓️ Working Days Calendar</h1>
        <p className="subtitle">
          Multi-level calendar with holidays and leave tracking
        </p>
      </header>

      <main className="app-content">
        <div className="calendar-section">
          <WorkingCalendar
            data={calendarData}
            colors={colors}
            fullscreen={true}
            showLegend={true}
            legendPosition="bottom"
            onDateClick={handleDateClick}
            onChange={handleChange}
            onSelect={handleSelect}
            cellRender={(context) => (
              <div className="custom-cell">
                <div className="custom-cell-date">{context.date.getDate()}</div>
                {context.data.length > 0 && (
                  <div className="custom-cell-items">
                    {context.data.map((item, idx) => (
                      <div
                        key={idx}
                        className="custom-item"
                        style={{ backgroundColor: item.color }}
                        title={item.description}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
        </div>

        {/* Selected Date Info */}
        {selectedDate && (
          <aside className="info-panel">
            <h2>📅 Date Information</h2>
            <div className="date-info">
              <p>
                <strong>Date:</strong>{" "}
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <strong>Items on this date:</strong> {selectedItems.length}
              </p>

              {selectedItems.length > 0 && (
                <div className="items-list">
                  <h3>Events:</h3>
                  <ul>
                    {selectedItems.map((item, idx) => (
                      <li key={idx} className={`item-type-${item.type}`}>
                        <span
                          className="item-color"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.description}</p>
                          <span className="item-badge">{item.type}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2024 Working Days Calendar | Built with React + TypeScript</p>
      </footer>
    </div>
  );
}

export default App;
