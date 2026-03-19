import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { type CalendarDataItem } from "./WorkingCalendar";
import "./Calendar.css";

interface CalendarModalProps {
  date: Date;
  type: "holiday" | "event" | "custom-weekend" | "non-leave-day";
  editingItem?: CalendarDataItem | null;
  onSave: (data: any) => void;
  onClose: () => void;
}

interface FormData {
  title?: string;
  type: "holiday" | "event" | "custom-weekend" | "non-leave-day";
  color: string;
  description?: string;
  time?: string;
  notes?: string;
  recurringType?: "single" | "monthly" | "yearly";
  holidayType?: "national" | "religious" | "cultural" | "company";
}

const DEFAULT_COLORS = {
  event: "#28A745",
  holiday: "#DC3545",
  "custom-weekend": "#FFC107",
  "non-leave-day": "#17A2B8",
};

const HOLIDAY_TYPES = [
  { value: "national", label: "National Holiday" },
  { value: "religious", label: "Religious Holiday" },
  { value: "cultural", label: "Cultural Holiday" },
  { value: "company", label: "Company Holiday" },
];

const COLORS = [
  "#DC3545", // Red
  "#007BFF", // Blue
  "#28A745", // Green
  "#FFC107", // Yellow
  "#17A2B8", // Cyan
  "#6F42C1", // Purple
  "#FF6B6B", // Light Red
  "#4ECDC4", // Teal
];

/**
 * Unified modal for all 4 calendar event types
 * Shows/hides fields based on event type
 */
export const CalendarModal: React.FC<CalendarModalProps> = ({
  date,
  type,
  editingItem,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: editingItem?.label || "",
    type,
    color: editingItem?.color || DEFAULT_COLORS[type],
    description: editingItem?.description || "",
    time: editingItem?.metadata?.time || "09:00",
    notes: editingItem?.metadata?.notes || "",
    recurringType: editingItem?.metadata?.recurringType || "single",
    holidayType: editingItem?.metadata?.holidayType || "national",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const typeLabels = {
    event: "Event",
    holiday: "Holiday",
    "custom-weekend": "Custom Weekend",
    "non-leave-day": "Non-Leave Day",
  };

  // Determine which fields to show based on type
  const showFields = useMemo(
    () => ({
      title: type === "event" || type === "holiday",
      time: type === "event",
      notes: type === "non-leave-day",
      description: type === "event" || type === "holiday",
      holidayType: type === "holiday",
      recurringType: type === "holiday" || type === "non-leave-day",
      color: true,
    }),
    [type],
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (showFields.title && !formData.title?.trim()) {
      newErrors.title = `${typeLabels[type]} name is required`;
    }

    if (showFields.time && !formData.time) {
      newErrors.time = "Time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const data = {
      date,
      type,
      label:
        formData.title ||
        (type === "custom-weekend" ? "Custom Weekend" : "Non-Leave Day"),
      color: formData.color,
      description: formData.description,
      metadata: {
        time: formData.time,
        notes: formData.notes,
        recurringType: formData.recurringType,
        holidayType: formData.holidayType,
      },
    };

    onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>
            {editingItem
              ? `Edit ${typeLabels[type]}`
              : `Add ${typeLabels[type]}`}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Date Info */}
        <div className="modal-date-info">
          <span className="date-label">Date:</span>
          <span className="date-value">
            {format(date, "EEEE, MMMM d, yyyy")}
          </span>
        </div>

        {/* Form */}
        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {/* Title Field - Event, Holiday */}
          {showFields.title && (
            <div className="form-group">
              <label htmlFor="title">
                {type === "event" ? "Event Title" : "Holiday Name"} *
              </label>
              <input
                id="title"
                type="text"
                className={`form-input ${errors.title ? "error" : ""}`}
                value={formData.title || ""}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder={`Enter ${type === "event" ? "event" : "holiday"} name`}
              />
              {errors.title && (
                <span className="error-message">{errors.title}</span>
              )}
            </div>
          )}

          {/* Holiday Type - Holiday */}
          {showFields.holidayType && (
            <div className="form-group">
              <label htmlFor="holidayType">Holiday Type *</label>
              <select
                id="holidayType"
                className="form-select"
                value={formData.holidayType || "national"}
                onChange={(e) =>
                  handleInputChange("holidayType", e.target.value)
                }
              >
                {HOLIDAY_TYPES.map((ht) => (
                  <option key={ht.value} value={ht.value}>
                    {ht.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Field - Event */}
          {showFields.time && (
            <div className="form-group">
              <label htmlFor="time">Time *</label>
              <input
                id="time"
                type="time"
                className={`form-input ${errors.time ? "error" : ""}`}
                value={formData.time || "09:00"}
                onChange={(e) => handleInputChange("time", e.target.value)}
              />
              {errors.time && (
                <span className="error-message">{errors.time}</span>
              )}
            </div>
          )}

          {/* Description Field - Event, Holiday */}
          {showFields.description && (
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="form-textarea"
                value={formData.description || ""}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Add description (optional)"
                rows={3}
              />
            </div>
          )}

          {/* Notes Field - Non-Leave Day */}
          {showFields.notes && (
            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                className="form-textarea"
                value={formData.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Add notes about this non-leave day"
                rows={3}
              />
            </div>
          )}

          {/* Recurring Type - Holiday, Non-Leave Day */}
          {showFields.recurringType && (
            <div className="form-group">
              <label htmlFor="recurringType">Repeat Pattern</label>
              <select
                id="recurringType"
                className="form-select"
                value={formData.recurringType || "single"}
                onChange={(e) =>
                  handleInputChange("recurringType", e.target.value)
                }
              >
                <option value="single">Single Day</option>
                <option value="monthly">Every Month (same date)</option>
                <option value="yearly">Every Year</option>
              </select>
            </div>
          )}

          {/* Color Picker - All Types */}
          {showFields.color && (
            <div className="form-group">
              <label>Color</label>
              <div className="color-picker">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option ${formData.color === color ? "selected" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleInputChange("color", color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Type Info - Custom Weekend, Non-Leave Day */}
          {(type === "custom-weekend" || type === "non-leave-day") && (
            <div className="form-info">
              <p className="info-text">
                {type === "custom-weekend"
                  ? "📌 This day will be marked as a custom weekend"
                  : "✓ This day will be available for work (no leave required)"}
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            {editingItem && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  // Handle delete
                  console.log("Delete:", editingItem);
                  onClose();
                }}
              >
                Delete
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {editingItem ? "Update" : "Add"} {typeLabels[type]}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarModal;
