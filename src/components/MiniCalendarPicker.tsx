import React, { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
} from "date-fns";
import "./Calendar.css";

interface MiniCalendarPickerProps {
  currentDate: Date;
  onSelect: (date: Date) => void;
}

/**
 * Mini calendar popup for quick date selection with search
 */
export const MiniCalendarPicker: React.FC<MiniCalendarPickerProps> = ({
  currentDate,
  onSelect,
}) => {
  const [displayMonth, setDisplayMonth] = useState(currentDate);
  const [searchInput, setSearchInput] = useState(
    format(currentDate, "MMMM yyyy"),
  );
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);

  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());

  const endDate = new Date(monthEnd);
  const daysToAdd = 6 - monthEnd.getDay();
  endDate.setDate(endDate.getDate() + daysToAdd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weeks: Date[][] = [];

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const handlePrevMonth = () => {
    const prev = subMonths(displayMonth, 1);
    setDisplayMonth(prev);
    setSearchInput(format(prev, "MMMM yyyy"));
  };

  const handleNextMonth = () => {
    const next = addMonths(displayMonth, 1);
    setDisplayMonth(next);
    setSearchInput(format(next, "MMMM yyyy"));
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(displayMonth);
    newDate.setFullYear(year);
    setDisplayMonth(newDate);
    setSearchInput(format(newDate, "MMMM yyyy"));
    setYearPickerOpen(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    // Try to parse the input as a date
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      setDisplayMonth(parsed);
    }
  };

  const handleDateClick = (date: Date) => {
    onSelect(date);
  };

  const currentYear = displayMonth.getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i);

  return (
    <div className="mini-calendar-picker">
      {/* Search/Header */}
      <div className="mini-calendar-header">
        <input
          type="text"
          className="mini-calendar-search"
          placeholder="Search month/year (e.g., Feb 2024)"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Year Picker */}
      {yearPickerOpen && (
        <div className="year-picker">
          <div className="year-picker-header">
            <button onClick={() => setYearPickerOpen(false)}>← Back</button>
            <span>Select Year</span>
          </div>
          <div className="year-grid">
            {years.map((year) => (
              <button
                key={year}
                className={`year-item ${year === currentYear ? "selected" : ""}`}
                onClick={() => handleYearSelect(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mini Calendar */}
      {!yearPickerOpen && (
        <>
          {/* Month Navigation */}
          <div className="mini-calendar-nav">
            <button className="mini-nav-btn" onClick={handlePrevMonth}>
              ←
            </button>
            <div
              className="mini-month-year"
              onClick={() => setYearPickerOpen(true)}
              style={{ cursor: "pointer" }}
            >
              {format(displayMonth, "MMMM yyyy")}
            </div>
            <button className="mini-nav-btn" onClick={handleNextMonth}>
              →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="mini-calendar-grid">
            {/* Weekday headers */}
            <div className="mini-weekday-header">
              {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                <div key={day} className="mini-weekday">
                  {day}
                </div>
              ))}
            </div>

            {/* Dates */}
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="mini-week">
                {week.map((date) => {
                  const isCurrentMonth = isSameMonth(date, displayMonth);
                  const isCurrentDate = isSameDay(date, currentDate);

                  return (
                    <button
                      key={format(date, "yyyy-MM-dd")}
                      className={`mini-date ${!isCurrentMonth ? "other-month" : ""} ${
                        isCurrentDate ? "selected" : ""
                      }`}
                      onClick={() => handleDateClick(date)}
                    >
                      {format(date, "d")}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer - Today button */}
          <div className="mini-calendar-footer">
            <button
              className="mini-today-btn"
              onClick={() => {
                const today = new Date();
                setDisplayMonth(today);
                setSearchInput(format(today, "MMMM yyyy"));
                handleDateClick(today);
              }}
            >
              Today
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MiniCalendarPicker;
