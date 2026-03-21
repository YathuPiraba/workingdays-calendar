# react-working-days-calendar

A fully-featured, timezone-aware working days calendar component for React. Supports event pills, multi-date selection, overflow dialogs, custom renderers, and a mini-calendar date picker — all with zero UI framework dependencies.

[![npm version](https://img.shields.io/npm/v/react-working-days-calendar.svg)](https://www.npmjs.com/package/react-working-days-calendar)
[![license](https://img.shields.io/npm/l/react-working-days-calendar.svg)](https://github.com/YathuPiraba/working-days-calendar/blob/master/LICENSE)

---

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
import "react-working-days-calendar/dist/react-working-days-calendar.css";

const events = [
  {
    id: "evt-005",
    date: "2026-03-08T15:00:00+00:00",
    timezone: "UTC",
    label: "Budget review",
    color: "#E67E22",
    priority: 3,
    data: {
      quarter: "Q2",
      presenter: "Finance team",
      room: "Board room A",
    },
  },
];

export default function App() {
  return (
    <WorkingCalendar
      legend="Team Calendar"
      events={events}
      onDateClick={(date) => console.log("Clicked:", date)}
    />
  );
}
```

---

## Features

- 📅 **Monthly grid view** with week number badges
- 🎨 **Colored event pills** with auto-contrast foreground text
- 🌍 **Timezone-aware** — per-event or global IANA timezone support (`date-fns-tz`)
- 📌 **Event overflow dialog** — see all events when a cell has more than 2
- 🖱️ **Hover tooltips** with custom data fields
- ✅ **Multi-date selection** mode with badge counter
- 🔍 **Mini calendar picker** for fast month/year navigation
- 📖 **Dynamic legend strip** auto-generated from visible events
- 🚫 **Disabled dates** support (single or array)
- 🔌 **Custom renderers** for pills and tooltips
- 📱 **Responsive** — adapts day headers from full name to single letter

---

## Props

### `WorkingCalendarProps`

| Prop                  | Type                                    | Default | Description                                         |
| --------------------- | --------------------------------------- | ------- | --------------------------------------------------- |
| `legend`              | `string`                                | —       | Label shown top-left of the header                  |
| `events`              | `CalendarEvent[]`                       | `[]`    | Events to display in the grid                       |
| `onDateClick`         | `(date: string) => void`                | —       | Fired when clicking the `+` icon on a cell          |
| `onEventClick`        | `(event: CalendarEvent) => void`        | —       | Fired when an event pill is clicked                 |
| `onMultiSelectDates`  | `(dates: string[]) => void`             | —       | Fired when Add is clicked in multi-select mode      |
| `onMonthYearChange`   | `(month: number, year: number) => void` | —       | Fired on any month navigation (month is 1-indexed)  |
| `multiSelect`         | `boolean`                               | `false` | Enable multi-date selection mode                    |
| `multiSelectAddLabel` | `string`                                | `"Add"` | Label on the Add button in multi-select mode        |
| `disableDate`         | `string \| Date \| number`              | —       | Single date to disable                              |
| `disabledDates`       | `Array<string \| Date \| number>`       | `[]`    | Array of dates to disable                           |
| `calendarTimezone`    | `string`                                | local   | IANA timezone for events without their own timezone |
| `hideLegend`          | `boolean`                               | `false` | Hide the legend strip even when events exist        |
| `renderEvent`         | `(event, ctx) => ReactNode`             | —       | Custom pill renderer                                |
| `renderTooltip`       | `(event) => ReactNode`                  | —       | Custom tooltip / overflow detail renderer           |

---

## `CalendarEvent` Shape

```ts
interface CalendarEvent {
  id: string;
  date: string | Date | number; // 'yyyy-MM-dd' | 'MM/dd/yyyy' | 'dd-MM-yyyy' | ISO | timestamp
  label: string;
  color?: string; // Any valid CSS color: hex, hsl(), rgb(), var(--token)
  priority?: number; // Higher = rendered first. Default: 0
  timezone?: string; // IANA string, e.g. "America/New_York"
  data?: Record<string, unknown>; // Passed through to renderEvent / renderTooltip
  onClick?: (event: CalendarEvent) => void;
}
```

---

## Date Formats Supported

```ts
date: "2026-03-21"; // yyyy-MM-dd   ✅
date: "03/21/2026"; // MM/dd/yyyy   ✅
date: "21-03-2026"; // dd-MM-yyyy   ✅
date: new Date(2026, 2, 21); // JS Date      ✅
date: 1742515200000; // timestamp    ✅
date: "2026-03-21T09:00:00+05:30"; // ISO + offset ✅
```

---

## Timezone Support

Events are placed on the calendar day they occur in a specific timezone, regardless of the viewer's local clock.

```tsx
const events = [
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
];

// Or set a global timezone for all events that don't specify their own
<WorkingCalendar calendarTimezone="Asia/Colombo" events={events} />;
```

---

## Custom Renderers

### Custom Event Pill

```tsx
<WorkingCalendar
  events={events}
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

```tsx
<WorkingCalendar
  events={events}
  renderTooltip={(event) => (
    <div>
      <strong>{event.label}</strong>
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
  disableDate="2026-03-19"
  disabledDates={["2026-03-26", new Date(2026, 2, 27)]}
/>
```

![Disabled dates](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/disableDate.png)

---

## Fetch Events on Month Change

```tsx
const [events, setEvents] = useState([]);

<WorkingCalendar
  events={events}
  onMonthYearChange={(month, year) => {
    fetchEventsFromAPI(month, year).then(setEvents);
  }}
/>;
```

---

## Event Overflow Dialog

When a calendar cell has more than 2 events, an overflow dialog lets users view all of them without cluttering the grid.

![Event overflow dialog](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/overflow.png)

---

## Mini Calendar Picker

A compact date picker for fast month and year navigation.

![Mini calendar picker](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/miniCalendar.png)

---

## Dynamic Legend Strip

The legend strip is auto-generated from visible events in the current month view.

![Legend strip](https://raw.githubusercontent.com/YathuPiraba/working-days-calendar/master/docs/legend.png)

---

## TypeScript

All types are exported:

```ts
import type {
  CalendarEvent,
  WorkingCalendarProps,
  EventRenderContext,
} from "react-working-days-calendar";
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
