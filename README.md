# react-working-days-calendar

A fully-featured, timezone-aware working days calendar component for React. Supports event pills, multi-day spanning events, week view with hourly time axis, multi-date selection, overflow dialogs, custom renderers, and a mini-calendar date picker — all with zero UI framework dependencies.

[![npm version](https://img.shields.io/npm/v/react-working-days-calendar.svg)](https://www.npmjs.com/package/react-working-days-calendar)
[![license](https://img.shields.io/npm/l/react-working-days-calendar.svg)](https://github.com/YathuPiraba/working-days-calendar/blob/master/LICENSE)

---

```tsx
<WorkingCalendar
  legend="Team Calendar"
  events={mockEvents}
  onDateClick={(date) => console.log("date clicked", date)}
  onEventClick={(event) => console.log("event clicked", event)}
  onMonthYearChange={(month, year) => console.log("month changed", month, year)}
/>
```

![Working Days Calendar – overall view](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/default.png)

---

## Installation

```bash
npm install react-working-days-calendar date-fns date-fns-tz
```

> **Peer dependencies:** `react >= 17`, `react-dom >= 17`

---

## Quick Start

```tsx
import WorkingCalendar from "react-working-days-calendar";
import "react-working-days-calendar/dist/style.css";

const events = [
  {
    id: "sprint-22",
    date: "2026-03-03",
    endDate: "2026-03-07",
    label: "Sprint 22",
    color: "#3B8BD4",
    priority: 2,
    data: { team: "Engineering", points: "42 estimated" },
  },
  {
    id: "budget-review",
    date: "2026-03-08T15:00:00+00:00",
    timezone: "UTC",
    label: "Budget review",
    color: "#E67E22",
    priority: 3,
    data: { quarter: "Q2", presenter: "Finance team" },
  },
];

export default function App() {
  return (
    <WorkingCalendar
      legend="Team Calendar"
      weekView
      events={events}
      onDateClick={(date) => console.log("Clicked:", date)}
    />
  );
}
```

---

## Features

- 📅 **Monthly grid view** with week number badges
- 🗓️ **Week view** with hourly time axis, overlap-aware event columns, and current-time indicator
- 📆 **Multi-day spanning events** — pills stretch seamlessly across day cells and row boundaries
- 🕐 **All-day event banner** — events without a time component appear in a dedicated sticky strip above the time grid in week view
- 🔀 **Month / Week toggle** — optional inline view switcher in the header
- 🎨 **Colored event pills** with auto-contrast foreground text
- 🌍 **Timezone-aware** — per-event or global IANA timezone support (`date-fns-tz`)
- 📌 **Event overflow dialog** — see all events when a cell has more than 2
- 🖱️ **Hover tooltips** with custom data fields, timezone badge, and date range display
- ✅ **Multi-date selection** mode with badge counter
- 🔍 **Mini calendar picker** for fast month/year navigation
- 📖 **Dynamic legend strip** auto-generated from visible events
- 🚫 **Disabled dates** support (single or array)
- 🔌 **Custom renderers** for pills and tooltips
- 📱 **Responsive** — adapts day headers from full name to single letter

---

## Props

### `WorkingCalendarProps`

| Prop                  | Type                                    | Default | Description                                                                     |
| --------------------- | --------------------------------------- | ------- | ------------------------------------------------------------------------------- |
| `legend`              | `string`                                | —       | Label shown between the header and the day-name row                             |
| `events`              | `CalendarEvent[]`                       | `[]`    | Events to display in the grid                                                   |
| `onDateClick`         | `(date: string) => void`                | —       | Fired when clicking the `+` icon on a cell                                      |
| `onEventClick`        | `(event: CalendarEvent) => void`        | —       | Fired when any event pill is clicked (month or week view)                       |
| `onMultiSelectDates`  | `(dates: string[]) => void`             | —       | Fired when Add is clicked in multi-select mode                                  |
| `onMonthYearChange`   | `(month: number, year: number) => void` | —       | Fired on any month navigation (month is 1-indexed)                              |
| `weekView`            | `boolean`                               | `false` | Enables the Month / Week toggle. When `false`, only month view is shown         |
| `onViewChange`        | `(view: CalendarView) => void`          | —       | Fired when the user switches between `"month"` and `"week"` view                |
| `onWeekChange`        | `(weekStartDate: string) => void`       | —       | Fired when the visible week changes in week view (receives Sunday `yyyy-MM-dd`) |
| `multiSelect`         | `boolean`                               | `false` | Enable multi-date selection mode                                                |
| `multiSelectAddLabel` | `string`                                | `"Add"` | Label on the Add button in multi-select mode                                    |
| `disableDate`         | `string \| Date \| number`              | —       | Single date to disable                                                          |
| `disabledDates`       | `Array<string \| Date \| number>`       | `[]`    | Array of dates to disable                                                       |
| `calendarTimezone`    | `string`                                | local   | IANA timezone for events without their own timezone                             |
| `hideLegend`          | `boolean`                               | `false` | Hide the legend strip even when events exist                                    |
| `renderEvent`         | `(event, ctx) => ReactNode`             | —       | Custom pill renderer (month view)                                               |
| `renderTooltip`       | `(event) => ReactNode`                  | —       | Custom tooltip / overflow detail renderer (month and week view)                 |

---

## `CalendarEvent` Shape

```ts
interface CalendarEvent {
  id: string | number;
  date: string | Date | number; // Start date — see formats below
  endDate?: string | Date | number; // Optional end date for multi-day events
  label: string;
  color?: string; // Any valid CSS color: hex, hsl(), rgb(), var(--token)
  priority?: number; // Higher = rendered first / lower track slot. Default: 0
  timezone?: string; // IANA string, e.g. "America/New_York"
  data?: Record<string, unknown>; // Passed through to renderEvent / renderTooltip
  onClick?: (event: CalendarEvent) => void;
}
```

> **`endDate` rules:** Must be ≥ `date`. Accepts the same formats as `date`. When omitted the event is treated as single-day. Multi-day events spanning a row boundary automatically continue on the next row with a muted continuation bar.

---

## Date Formats Supported

```ts
date: "2026-03-21"; // yyyy-MM-dd  (all-day, no time axis position)  ✅
date: "03/21/2026"; // MM/dd/yyyy                                    ✅
date: "21-03-2026"; // dd-MM-yyyy                                    ✅
date: new Date(2026, 2, 21); // JS Date                                       ✅
date: 1742515200000; // Unix timestamp (ms)                           ✅
date: "2026-03-21T09:00:00+05:30"; // ISO 8601 with offset (timed event)            ✅
```

---

## Multi-Day Spanning Events

Add an `endDate` to any event to make it span across multiple day cells. The pill stretches seamlessly from start to end, with the label shown only on the first visible cell.

```tsx
<WorkingCalendar
  legend="Team Calendar"
  events={[
    {
      id: "sprint-23",
      date: "2026-03-16",
      endDate: "2026-03-20",
      label: "Sprint 23",
      color: "#3B8BD4",
      priority: 2,
      data: { team: "Engineering", points: "38 estimated" },
    },
    {
      id: "conference",
      date: "2026-03-19",
      endDate: "2026-03-23", // crosses a row boundary
      label: "Design conference",
      color: "#9B59B6",
      data: { location: "San Francisco" },
    },
  ]}
  onEventClick={(event) => console.log("event clicked", event)}
/>
```

![Multi-day spanning events](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/multiday.png)

**Overflow anchor rule:** When a multi-day event contributes to cell overflow, the `+N more` chip appears on the event's start cell. If the start date is in a previous month (off-screen), the chip falls back to the first visible cell of the span.

---

## Week View

Enable week view by passing `weekView` to the calendar. A **Month / Week** toggle appears in the header. Users start in month view and can switch to week view.

```tsx
<WorkingCalendar
  legend="Team Calendar"
  events={mockEvents}
  weekView
  onEventClick={(event) => console.log("event clicked", event)}
  onMonthYearChange={(month, year) => console.log("month changed", month, year)}
  onViewChange={(view) => console.log("view changed", view)}
  onWeekChange={(weekStart) => console.log("week changed", weekStart)}
/>
```

![Week view – hourly time grid](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/weekview.png)

**Week view features:**

- Hourly time axis from 12 AM to 12 AM (full day)
- Timed events (ISO strings with `T`) placed and sized by their start time and duration
- Overlapping timed events split into side-by-side columns automatically
- Current-time indicator line with dot on today's column
- All-day events (plain `yyyy-MM-dd` dates, no time component) appear in a sticky **all-day banner** above the time grid, spanning the correct number of day columns

### All-Day Banner

Events with no time component appear in a sticky strip above the time grid. Multi-day all-day events stretch across the correct day columns.

```tsx
<WorkingCalendar
  legend="Team Calendar"
  events={[
    {
      id: "sprint-22",
      date: "2026-03-03",
      endDate: "2026-03-07", // date-only → all-day banner, spans 5 columns
      label: "Sprint 22",
      color: "#3B8BD4",
    },
    {
      id: "budget-review",
      date: "2026-03-05T15:00:00+00:00",
      timezone: "UTC",
      label: "Budget review", // timed → hourly time grid
      color: "#E67E22",
    },
  ]}
  weekView
  onViewChange={(view) => console.log("view changed", view)}
  onWeekChange={(weekStart) => console.log("week changed", weekStart)}
/>
```

![Week view – all-day banner](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/weekview-allday.png)

### Overlapping Timed Events

Timed events that overlap are automatically placed in side-by-side columns within the day.

```tsx
<WorkingCalendar
  legend="Team Calendar"
  events={[
    {
      id: "overlap-001",
      date: "2026-03-17T09:00:00",
      label: "All-hands",
      color: "#2C3E50",
    },
    {
      id: "overlap-002",
      date: "2026-03-17T09:30:00",
      endDate: "2026-03-17T11:00:00", // overlaps with overlap-001
      label: "Hiring panel",
      color: "#9B59B6",
    },
    {
      id: "overlap-003",
      date: "2026-03-17T10:00:00",
      endDate: "2026-03-17T10:45:00", // overlaps with overlap-002
      label: "Security scan",
      color: "#E67E22",
    },
  ]}
  weekView
  onEventClick={(event) => console.log("event clicked", event)}
/>
```

![Week view – overlapping events](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/weekview-overlap.png)

**Week navigation:** The `‹` and `›` arrows step through weeks when in week view, firing `onWeekChange` each time. Clicking **Today** resets to the current week.

**Switching views:** When switching from month to week view, the calendar snaps to the first week of the currently displayed month. If that month is the current month, it snaps to the current week instead.

---

## All-Day vs Timed Events in Week View

| Event `date` value            | Week view placement             |
| ----------------------------- | ------------------------------- |
| `"2026-03-21"` (date only)    | All-day banner strip            |
| `"2026-03-21T09:00:00+00:00"` | Hourly time grid, at 9:00 AM    |
| `new Date(...)` / timestamp   | Hourly time grid, at event time |

---

## Timezone Support

Events are placed on the calendar day they occur in a specific timezone, regardless of the viewer's local clock. Tooltips show the timezone name and UTC offset.

```tsx
<WorkingCalendar
  legend="Team Calendar"
  events={[
    {
      id: "ny-standup",
      date: "2026-03-21T09:00:00-05:00",
      timezone: "America/New_York",
      label: "NY Standup",
      color: "#3B8BD4",
    },
    {
      id: "colombo-call",
      date: "2026-03-21T08:30:00+05:30",
      timezone: "Asia/Colombo",
      label: "Colombo Call",
      color: "#9B59B6",
    },
  ]}
  onEventClick={(event) => console.log("event clicked", event)}
/>

// Or set a global timezone for all events that don't specify their own
<WorkingCalendar
  calendarTimezone="Asia/Colombo"
  events={events}
  onEventClick={(event) => console.log("event clicked", event)}
/>
```

![Tooltip – timed event with timezone](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/tooltip-timed.png)

## Custom Renderers

### Custom Event Pill

```tsx
<WorkingCalendar
  legend="Team Calendar"
  events={mockEvents}
  renderEvent={(event, ctx) => (
    <div
      style={{
        background: event.color,
        padding: "2px 6px",
        borderRadius: 4,
        color: "#fff",
        fontSize: 12,
      }}
    >
      🔔 {event.label}
    </div>
  )}
/>
```

### Custom Tooltip / Detail Panel

The same `renderTooltip` is used in month view hover tooltips, the overflow dialog detail panel, and week view event hover tooltips.

```tsx
<WorkingCalendar
  legend="Team Calendar"
  events={mockEvents}
  renderTooltip={(event) => (
    <div style={{ padding: "10px 12px" }}>
      <strong>{event.label}</strong>
      {event.endDate && (
        <p>
          {String(event.date).slice(0, 10)} →{" "}
          {String(event.endDate).slice(0, 10)}
        </p>
      )}
      <p>Owner: {event.data?.owner as string}</p>
      <p>Time: {event.data?.time as string}</p>
    </div>
  )}
/>
```

---

## Multi-Select Mode

```tsx
<WorkingCalendar
  legend="Team Calendar"
  events={mockEvents}
  multiSelect
  multiSelectAddLabel="Schedule"
  onMultiSelectDates={(dates) => {
    // dates: ['2026-03-10', '2026-03-14', ...]
    console.log("Selected dates:", dates);
  }}
/>
```

![Multi-select mode](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/multiselect.png)

---

## Disabled Dates

```tsx
<WorkingCalendar
  legend="Team Calendar"
  events={mockEvents}
  disableDate="2026-03-19"
  disabledDates={["2026-03-26", new Date(2026, 2, 27)]}
  onDateClick={(date) => console.log("date clicked", date)}
/>
```

![Disabled dates](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/disableDate.png)

---

## Fetch Events on Navigation Change

```tsx
const [events, setEvents] = useState([]);

<WorkingCalendar
  legend="Team Calendar"
  weekView
  events={events}
  onMonthYearChange={(month, year) => {
    fetchMonthEvents(month, year).then(setEvents);
  }}
  onWeekChange={(weekStart) => {
    fetchWeekEvents(weekStart).then(setEvents);
  }}
/>;
```

---

## Event Overflow Dialog

When a calendar cell has more than 2 events, an overflow chip opens a dialog showing all events with their full details. Multi-day events that overflow also participate — the chip appears on the start cell, or the first visible cell if the start is off-screen.

```tsx
<WorkingCalendar
  legend="Team Calendar"
  events={mockEvents}
  onEventClick={(event) => console.log("event clicked", event)}
/>
```

![Event overflow dialog](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/overflow.png)

---

## Mini Calendar Picker

Click the month/year button in the header to open the compact date picker for fast month and year navigation.

```tsx
<WorkingCalendar
  legend="Team Calendar"
  events={mockEvents}
  onMonthYearChange={(month, year) => console.log("month changed", month, year)}
/>
```

![Mini calendar picker](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/miniCalendar.png)

---

## Dynamic Legend Strip

The legend strip is auto-generated from visible events in the current month view. Multi-day events that overlap the month are included even if their start date is in a prior month.

```tsx
<WorkingCalendar
  legend="Team Calendar"
  events={mockEvents}
  onEventClick={(event) => console.log("event clicked", event)}
/>
```

![Legend strip](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/legend.png)

---

## TypeScript

All types are exported:

```ts
import type {
  CalendarEvent,
  CalendarView,
  WorkingCalendarProps,
  EventRenderContext,
  SpanRole,
  SpanSegment,
  SpanMap,
  BannerEntry,
  PositionedEvent,
} from "react-working-days-calendar";
```

### `CalendarView`

```ts
type CalendarView = "month" | "week";
```

### `SpanRole`

Describes how a multi-day event renders in a specific cell:

```ts
type SpanRole =
  | "solo" // single-day event
  | "start" // first day of a spanning event
  | "mid" // middle day(s) — continuation bar, no label
  | "end" // last day of a spanning event
  | "firstVisible"; // true start is off-screen; this cell is the fallback anchor
```

---

## CSS Customization

The component uses CSS custom properties. Override them in your global stylesheet to theme the calendar:

```css
:root {
  --wc-today-bg: #ede9fe; /* Today cell highlight */
  --wc-today-color: #5b21b6; /* Today circle color */
  --wc-weekend-bg: #f9fafb; /* Weekend column background */
  --wc-disabled-bg: #f3f4f6; /* Disabled date background */
  --wc-border: #e5e7eb; /* Grid border color */
  --wc-header-bg: #ffffff; /* Header background */
  --wc-selected-bg: #ede9fe; /* Multi-select selected cell */
}
```

---

## Changelog

### 1.1.3

- Patch fixes and dependency updates

### 1.1.2

- Patch fixes and dependency updates

### 1.1.1

- Patch fixes and dependency updates

### 1.1.0

- **Multi-day spanning events** — add `endDate` to any `CalendarEvent` to stretch pills across cells
- **Week view** — hourly time axis, overlap-aware event columns, current-time indicator
- **All-day banner** — events without a time component appear in a sticky strip above the week view time grid; multi-day all-day events span the correct columns
- **Month / Week toggle** — enabled via `weekView` prop; animated sliding indicator
- **`onWeekChange` callback** — fires when the visible week changes in week view
- **`onViewChange` callback** — fires when the user switches between month and week view
- **Week sync** — switching to week view snaps to the first week of the displayed month (or the current week if viewing the current month)
- **Hover tooltips in week view** — same `DefaultTooltip` and `renderTooltip` used across month view, overflow dialog, and week view pills
- **`CalendarView` type** exported — `"month" | "week"`
- **`SpanRole`, `SpanSegment`, `SpanMap` types** exported
- **`BannerEntry`, `PositionedEvent` types** exported

### 1.0.0

- Initial release
- Monthly grid with event pills, overflow dialog, tooltips
- Timezone-aware event placement via `date-fns-tz`
- Multi-date selection mode
- Mini calendar picker
- Custom `renderEvent` and `renderTooltip` slots
- Dynamic legend strip
- Disabled dates support

---

## License

MIT © [YathuPiraba](https://github.com/YathuPiraba)

> Source on [GitHub](https://github.com/YathuPiraba/working-days-calendar) — issues and PRs welcome.
