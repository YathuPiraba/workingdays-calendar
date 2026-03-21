import "./App.css";
import WorkingCalendar from "./components/WorkingCalendar";
import { mockEvents } from "./mockEvents";

function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <WorkingCalendar
        legend="Team calendar"
        events={mockEvents}
        multiSelect
        onMultiSelectDates={(dates) => console.log("dates selected", dates)}
        onEventClick={(event) => console.log("event clicked", event)}
        onMonthYearChange={(month, year) =>
          console.log("month changed", month, year)
        }
        disabledDates={["2026-03-27", new Date(2026, 2, 26)]}
        disableDate="2026-03-19"
      />
    </div>
  );
}

export default App;
