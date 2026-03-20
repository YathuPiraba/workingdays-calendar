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
        onDateClick={(date) => console.log("add on", date)}
        onEventClick={(event) => console.log("event clicked", event)}
      />
    </div>
  );
}

export default App;
