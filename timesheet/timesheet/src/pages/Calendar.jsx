import React, { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

function nthWeekdayOfMonth(year, monthIndex, weekday, nth) {
  const first = new Date(year, monthIndex, 1);
  const firstDay = first.getDay();
  const offset = (weekday - firstDay + 7) % 7;
  return new Date(year, monthIndex, 1 + offset + (nth - 1) * 7);
}

function holidayEventsForYear(year) {
  const thanksgiving = nthWeekdayOfMonth(year, 10, 4, 4); // Nov, Thursday, 4th
  const holidays = [
    { title: "New Year's Day", date: `${year}-01-01` },
    { title: "Independence Day", date: `${year}-07-04` },
    { title: "Christmas Day", date: `${year}-12-25` },
    {
      title: "Thanksgiving",
      date: `${thanksgiving.getFullYear()}-${String(thanksgiving.getMonth() + 1).padStart(2, "0")}-${String(
        thanksgiving.getDate()
      ).padStart(2, "0")}`,
    },
  ];

  return holidays.map((h, idx) => ({
    id: `${year}-${idx}`,
    title: `Holiday: ${h.title}`,
    start: h.date,
    allDay: true,
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
  }));
}

export default function Calendar() {
  const events = useMemo(() => {
    const y = new Date().getFullYear();
    return [...holidayEventsForYear(y), ...holidayEventsForYear(y + 1)];
  }, []);

  return (
    <div className="page-shell">
      <section className="page-header">
        <div className="page-header-title">
          <h1>Holiday Calendar</h1>
        </div>
        <p className="page-subtitle">
          A simple planning calendar so holidays are visible before hours are logged.
        </p>
      </section>

      <section className="panel calendar-card">
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          firstDay={1}
          allDaySlot={true}
          events={events}
          headerToolbar={{ left: "prev,next today", center: "title", right: "timeGridWeek,timeGridDay" }}
          height="auto"
        />
      </section>
    </div>
  );
}
