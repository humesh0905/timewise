
import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import TimesheetCalendarWithModal from "./components/TimesheetCalendarWithModal";

export default function App() {
  const [view, setView] = useState("timesheet");

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onSelect={setView} />
      <div style={{ flex: 1, overflow: "auto" }}>
        {view === "timesheet" && <TimesheetCalendarWithModal />}
        {/* later you can add other views here */}
      </div>
    </div>
  );
}


