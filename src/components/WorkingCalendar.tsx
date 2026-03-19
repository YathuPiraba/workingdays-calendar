// src/components/WorkingCalendar/Calendar.tsx

import React, { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  startOfDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
} from "date-fns";
import MiniCalendarPicker from "./MiniCalendarPicker";
import CalendarModal from "./CalendarModal";
import CalendarNav from "./CalendarNav";
import "./Calendar.css";

export interface CalendarDataItem {
  date: Date | string;
  type: "holiday" | "leave" | "event" | "weekend" | "non-leave-day" | "working";
  label?: string;
  color?: string;
  dotColor?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CellRenderContext {
  date: Date;
  data: CalendarDataItem[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isPastDate: boolean;
}

export interface WorkingCalendarProps {
  data?: CalendarDataItem[];
  colors?: Record<string, string>;
  value?: Date;
  defaultValue?: Date;
  disabledDates?: (Date | string)[];
  fullscreen?: boolean;
  bordered?: boolean;
  cellRender?: (context: CellRenderContext) => React.ReactNode;
  dateRender?: (date: Date) => React.ReactNode;
  headerRender?: (date: Date) => React.ReactNode;
  onChange?: (date: Date) => void;
  onSelect?: (date: Date) => void;
  onDateClick?: (date: Date, data: CalendarDataItem[]) => void;
  onAddEvent?: (date: Date, type: string) => void;
  onEditEvent?: (date: Date, item: CalendarDataItem) => void;
  onMultiSelectDates?: (dates: Date[]) => void;
  showLegend?: boolean;
  legendPosition?: "top" | "bottom" | "left" | "right";
  className?: string;
  style?: React.CSSProperties;
}

export const WorkingCalendar: React.FC<WorkingCalendarProps> = ({
  data = [],
  colors = {},
  value,
  defaultValue,
  disabledDates = [],
  fullscreen = true,
  bordered = true,
  cellRender,
  dateRender,
  headerRender,
  onChange,
  onSelect,
  onDateClick,
  onAddEvent,
  onEditEvent,
  onMultiSelectDates,
  showLegend = true,
  legendPosition = "bottom",
  className = "",
  style,
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    value || defaultValue || new Date(),
  );
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    "holiday" | "event" | "custom-weekend" | "non-leave-day"
  >("event");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "event" | "holiday" | "custom-weekend" | "non-leave-day"
  >("event");
  const [editingItem, setEditingItem] = useState<CalendarDataItem | null>(null);

  // Normalize disabled dates
  const disabledDatesSet = useMemo(() => {
    const set = new Set<string>();
    disabledDates.forEach((date) => {
      const dateStr =
        typeof date === "string" ? date : format(date, "yyyy-MM-dd");
      set.add(dateStr);
    });
    return set;
  }, [disabledDates]);

  // Normalize data: convert dates to ISO strings for lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, CalendarDataItem[]>();

    data.forEach((item) => {
      const dateStr = normalizeDateString(item.date);

      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push({
        ...item,
        color: item.color || colors[item.type] || getDefaultColor(item.type),
      });
    });

    return map;
  }, [data, colors]);

  // Group data by type for legend
  const legend = useMemo(() => {
    const typeMap = new Map<
      string,
      { type: string; color: string; count: number; label: string }
    >();

    data.forEach((item) => {
      const type = item.type;
      const color = item.color || colors[type] || getDefaultColor(type);

      if (!typeMap.has(type)) {
        typeMap.set(type, {
          type,
          color,
          count: 0,
          label: getTypeLabel(type),
        });
      }

      const entry = typeMap.get(type)!;
      entry.count++;
    });

    return Array.from(typeMap.values());
  }, [data, colors]);

  const isDateDisabled = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return disabledDatesSet.has(dateStr);
  };

  const handlePrevMonth = () => {
    const prev = subMonths(currentMonth, 1);
    setCurrentMonth(prev);
    onChange?.(prev);
  };

  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1);
    setCurrentMonth(next);
    onChange?.(next);
  };

  const handleMiniCalendarSelect = (date: Date) => {
    setCurrentMonth(date);
    setShowMiniCalendar(false);
    onChange?.(date);
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (multiSelectMode) {
      const dateStr = normalizeDateString(date);
      const isSelected = selectedDates.some(
        (d) => normalizeDateString(d) === dateStr,
      );

      if (isSelected) {
        setSelectedDates(
          selectedDates.filter((d) => normalizeDateString(d) !== dateStr),
        );
      } else {
        setSelectedDates([...selectedDates, date]);
      }
    } else {
      const dateStr = normalizeDateString(date);
      const items = dataMap.get(dateStr) || [];

      setSelectedDate(date);
      onSelect?.(date);
      onDateClick?.(date, items);
    }
  };

  const handleAddEvent = (date: Date, type: string) => {
    if (isDateDisabled(date)) return;
    const isPastDate = isBefore(date, startOfDay(new Date())) && !isToday(date);

    if (isPastDate) {
      alert("Cannot add events to past dates");
      return;
    }

    setSelectedDate(date);
    setModalType(type as any);
    setEditingItem(null);
    setShowModal(true);
    onAddEvent?.(date, type);
  };

  const handleEditEvent = (date: Date, item: CalendarDataItem) => {
    const isPastDate = isBefore(date, startOfDay(new Date())) && !isToday(date);

    if (isPastDate) {
      alert("Cannot edit past date events");
      return;
    }

    setSelectedDate(date);
    setEditingItem(item);
    setModalType(item.type as any);
    setShowModal(true);
    onEditEvent?.(date, item);
  };

  const handleModalSave = (formData: any) => {
    console.log("Saving:", formData);
    setShowModal(false);
  };

  const handleMultiSelectDone = () => {
    onMultiSelectDates?.(selectedDates);
    setMultiSelectMode(false);
    setSelectedDates([]);
  };

  const handleTabChange = (
    tab: "event" | "holiday" | "custom-weekend" | "non-leave-day",
  ) => {
    setActiveTab(tab);
  };

  return (
    <div
      className={`working-calendar ${fullscreen ? "fullscreen" : ""} ${bordered ? "bordered" : ""} ${className}`}
      style={style}
    >
      {/* Legend (if positioned at top) */}
      {showLegend && legendPosition === "top" && (
        <CalendarLegend items={legend} />
      )}

      {/* Calendar Nav */}
      <CalendarNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onMultiSelectToggle={() => setMultiSelectMode(!multiSelectMode)}
        multiSelectMode={multiSelectMode}
        selectedDatesCount={selectedDates.length}
        onMultiSelectDone={handleMultiSelectDone}
      />

      {/* Calendar Grid */}
      <div className="calendar-container">
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onMonthClick={() => setShowMiniCalendar(!showMiniCalendar)}
          headerRender={headerRender}
          showMiniCalendar={showMiniCalendar}
          miniCalendarDate={currentMonth}
          onMiniCalendarSelect={handleMiniCalendarSelect}
        />

        <CalendarGrid
          currentMonth={currentMonth}
          dataMap={dataMap}
          cellRender={cellRender}
          dateRender={dateRender}
          onDateClick={handleDateClick}
          onAddEvent={handleAddEvent}
          onEditEvent={handleEditEvent}
          isDateDisabled={isDateDisabled}
          selectedDates={selectedDates}
          multiSelectMode={multiSelectMode}
          activeTab={activeTab}
        />
      </div>

      {/* Footer - Current Month Summary */}
      <div className="calendar-footer">
        <p className="footer-text">
          {format(currentMonth, "MMMM yyyy")} • {legend.length} event type
          {legend.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Legend (if positioned at bottom) */}
      {showLegend && legendPosition === "bottom" && (
        <CalendarLegend items={legend} />
      )}

      {/* Modal */}
      {showModal && selectedDate && (
        <CalendarModal
          date={selectedDate}
          type={modalType}
          editingItem={editingItem}
          onSave={handleModalSave}
          onClose={() => {
            setShowModal(false);
            setSelectedDate(null);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Calendar Header with Month Navigation and Mini Calendar
 */
const CalendarHeader: React.FC<{
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthClick: () => void;
  headerRender?: (date: Date) => React.ReactNode;
  showMiniCalendar: boolean;
  miniCalendarDate: Date;
  onMiniCalendarSelect: (date: Date) => void;
}> = ({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onMonthClick,
  headerRender,
  showMiniCalendar,
  miniCalendarDate,
  onMiniCalendarSelect,
}) => {
  return (
    <div className="calendar-header-wrapper">
      <div className="calendar-header">
        <button
          className="nav-btn prev-btn"
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          ←
        </button>

        <h2
          className="calendar-title"
          onClick={onMonthClick}
          style={{ cursor: "pointer" }}
        >
          {headerRender
            ? headerRender(currentMonth)
            : format(currentMonth, "MMMM yyyy")}
        </h2>

        <button
          className="nav-btn next-btn"
          onClick={onNextMonth}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {showMiniCalendar && (
        <div className="mini-calendar-popup">
          <MiniCalendarPicker
            currentDate={miniCalendarDate}
            onSelect={onMiniCalendarSelect}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Calendar Grid
 */
const CalendarGrid: React.FC<{
  currentMonth: Date;
  dataMap: Map<string, CalendarDataItem[]>;
  cellRender?: (context: CellRenderContext) => React.ReactNode;
  dateRender?: (date: Date) => React.ReactNode;
  onDateClick: (date: Date) => void;
  onAddEvent: (date: Date, type: string) => void;
  onEditEvent: (date: Date, item: CalendarDataItem) => void;
  isDateDisabled: (date: Date) => boolean;
  selectedDates: Date[];
  multiSelectMode: boolean;
  activeTab: string;
}> = ({
  currentMonth,
  dataMap,
  cellRender,
  dateRender,
  onDateClick,
  onAddEvent,
  onEditEvent,
  isDateDisabled,
  selectedDates,
  multiSelectMode,
  activeTab,
}) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

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

  return (
    <div className="calendar-grid">
      <div className="weekday-header">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
      </div>

      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="week">
          {week.map((date) => {
            const dateStr = normalizeDateString(date);
            const items = dataMap.get(dateStr) || [];
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isDisabled = isDateDisabled(date);
            const isTodayDate = isToday(date);
            const isPastDate =
              isBefore(date, startOfDay(new Date())) && !isTodayDate;
            const isSelected = selectedDates.some(
              (d) => normalizeDateString(d) === dateStr,
            );

            const context: CellRenderContext = {
              date,
              data: items,
              isCurrentMonth,
              isToday: isTodayDate,
              isDisabled,
              isPastDate,
            };

            return (
              <div
                key={dateStr}
                className={`cell ${!isCurrentMonth ? "other-month" : ""} ${
                  isDisabled ? "disabled" : ""
                } ${isTodayDate ? "today" : ""} ${isPastDate ? "past-date" : ""} ${
                  isSelected && multiSelectMode ? "selected" : ""
                }`}
                onClick={() => onDateClick(date)}
              >
                {cellRender ? (
                  cellRender(context)
                ) : (
                  <CalendarCell
                    date={date}
                    items={items}
                    dateRender={dateRender}
                    isToday={isTodayDate}
                    isPastDate={isPastDate}
                    isDisabled={isDisabled}
                    onAddEvent={onAddEvent}
                    onEditEvent={onEditEvent}
                    activeTab={activeTab}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/**
 * Default Cell Renderer
 */
const CalendarCell: React.FC<{
  date: Date;
  items: CalendarDataItem[];
  dateRender?: (date: Date) => React.ReactNode;
  isToday: boolean;
  isPastDate: boolean;
  isDisabled: boolean;
  onAddEvent: (date: Date, type: string) => void;
  onEditEvent: (date: Date, item: CalendarDataItem) => void;
  activeTab: string;
}> = ({
  date,
  items,
  dateRender,
  isToday,
  isPastDate,
  isDisabled,
  onAddEvent,
  onEditEvent,
  activeTab,
}) => {
  return (
    <div className="cell-content">
      <div className="cell-header">
        <div className={`cell-date ${isToday ? "today-date" : ""}`}>
          {dateRender ? dateRender(date) : format(date, "d")}
        </div>
        {!isPastDate && !isDisabled && (
          <button
            className="cell-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAddEvent(date, activeTab);
            }}
            title="Add event"
          >
            +
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="cell-data">
          {items.slice(0, 2).map((item, idx) => (
            <div
              key={idx}
              className={`cell-item cell-item-${item.type}`}
              title={item.description || item.label}
              style={{
                backgroundColor: item.color,
                borderColor: item.dotColor,
                cursor: !isPastDate ? "pointer" : "default",
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isPastDate) {
                  onEditEvent(date, item);
                }
              }}
            >
              {item.label && <span className="item-label">{item.label}</span>}
            </div>
          ))}

          {items.length > 2 && (
            <div className="cell-more">+{items.length - 2}</div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Calendar Legend
 */
const CalendarLegend: React.FC<{
  items: Array<{ type: string; color: string; count: number; label: string }>;
}> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="calendar-legend">
      <div className="legend-title">Legend</div>
      <div className="legend-items">
        {items.map((item) => (
          <div key={item.type} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: item.color }}
              title={item.type}
            />
            <span className="legend-label">
              {item.label} ({item.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ Helper Functions ============

function normalizeDateString(date: Date | string): string {
  if (typeof date === "string") {
    return date;
  }
  return format(startOfDay(date), "yyyy-MM-dd");
}

function getDefaultColor(type: string): string {
  const colorMap: Record<string, string> = {
    holiday: "#DC3545",
    leave: "#007BFF",
    event: "#28A745",
    weekend: "#FFC107",
    "non-leave-day": "#17A2B8",
    "custom-weekend": "#FFC107",
    working: "#FFFFFF",
  };
  return colorMap[type] || "#CCCCCC";
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    holiday: "Holiday",
    leave: "Leave",
    event: "Event",
    weekend: "Weekend",
    "non-leave-day": "Non-Leave Day",
    "custom-weekend": "Custom Weekend",
    working: "Working",
  };
  return labels[type] || type;
}

export default WorkingCalendar;
