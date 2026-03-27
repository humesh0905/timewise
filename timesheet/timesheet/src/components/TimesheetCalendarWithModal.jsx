import React, { useState, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  ButtonGroup,
  Toolbar,
} from "@mui/material";

export default function TimesheetCalendarWithModal() {
  const [events, setEvents] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hours, setHours] = useState("");
  const [status, setStatus] = useState("Billing");
  const [editingEventId, setEditingEventId] = useState(null);


  const [viewRange, setViewRange] = useState({ start: null, end: null });

  const calendarRef = useRef(null);

  const formatDate = (d) =>
    d?.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const computeEnd = () =>
    selectedDate && hours
      ? new Date(selectedDate.getTime() + parseFloat(hours) * 3600_000)
      : null;

  const handleDateClick = useCallback((arg) => {
    setEditingEventId(null);
    setSelectedDate(arg.date);
    setHours("");
    setStatus("Billing");
    setDialogOpen(true);
  }, []);

  const handleEventClick = useCallback((clickInfo) => {
    const evt = clickInfo.event;
    setEditingEventId(evt.id);
    setSelectedDate(evt.start);
    setHours(String((evt.end - evt.start) / 3.6e6));
    setStatus(evt.extendedProps.status);
    setDialogOpen(true);
  }, []);

  
  const fetchTimesheet = async (weekStart) => {
    try {
      const res = await fetch(
        `http://localhost:8081/api/timesheets?userId=1&weekStart=${weekStart}`
      );
      if (!res.ok) throw new Error(await res.text());
      const { entries } = await res.json();
      // map DB entries -> FullCalendar events
      const loaded = entries.map(e => {
        const start = new Date(e.start_time);
        const end   = new Date(e.end_time);
        const hrs   = ((end - start) / 3.6e6).toFixed(2);
        return {
          id: String(e.entry_id),
          title: `${hrs}h`,
          start, end,
          extendedProps: { status: e.entry_status }
        };
      });
      setEvents(loaded);
    } catch (err) {
      console.error("Error loading timesheet:", err);
      setEvents([]);
    }
  };
  

  const handleSaveWeek = async () => {
    if (!viewRange.start) return;
    const weekStart = viewRange.start.toISOString().split("T")[0];

    const entries = events.map((e) => ({
      entry_id: Number(e.id) || undefined,
      start_time: e.start.toISOString(),
      end_time: e.end.toISOString(),
      entry_type: e.extendedProps.status,
    }));

    try {
      const res = await fetch("http://localhost:8081/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1,
          weekStart,
          entries,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      console.log("Draft saved:", data);
    } catch (err) {
      console.error("Error saving draft:", err);
    }
  };


  const handleSubmitWeek = async () => {
    if (!viewRange.start) return;
    const weekStart = viewRange.start.toISOString().split("T")[0];

    const entries = events.map((e) => ({
      entry_id: Number(e.id) || undefined,
      start_time: e.start.toISOString(),
      end_time: e.end.toISOString(),
      entry_type: e.extendedProps.status,
    }));

    try {
      const res = await fetch("http://localhost:8081/api/timesheets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:  1,
          weekStart,
          entries,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      console.log("Submitted:", data);
    } catch (err) {
      console.error("Error submitting timesheet:", err);
    }
  };

  
  const handleSave = () => {
    const start = selectedDate;
    const end = computeEnd();

    setEvents((evts) =>
      editingEventId
        ? evts.map((e) =>
            e.id === editingEventId
              ? { ...e, title: `${hours}h`, start, end, extendedProps: { status } }
              : e
          )
        : [
            ...evts,
            {
              id: String(
                evts.length ? Math.max(...evts.map((e) => +e.id)) + 1 : 1
              ),
              title: `${hours}h`,
              start,
              end,
              extendedProps: { status },
            },
          ]
    );

    setDialogOpen(false);
  };

  const handleDelete = () => {
    setEvents((evts) => evts.filter((e) => e.id !== editingEventId));
    setDialogOpen(false);
  };

  return (
    <>
      <h2>Time Sheet</h2>

      <Toolbar sx={{ justifyContent: "flex-end", mb: 2, px: 0 }}>
        <ButtonGroup variant="contained">
          <Button
            onClick={handleSaveWeek}
            disabled={events.length === 0}
            color="primary"
          >
            Save
          </Button>
          <Button
            onClick={handleSubmitWeek}
            disabled={events.length === 0}
            color="success"
          >
            Save &amp; Submit
          </Button>
        </ButtonGroup>
      </Toolbar>

      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        firstDay={1}
        slotMinTime="06:00:00"
        slotMaxTime="24:00:00"
        allDaySlot={false}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        datesSet={(info) => {
          const ws = info.start.toISOString().split("T")[0];
          setViewRange({ start: info.start, end: info.end });
          fetchTimesheet(ws);
        }}
        eventClassNames={(arg) => {
          const s = arg.event.extendedProps.status;
          if (s === "Billing") return ["fc-event--billable"];
          if (s === "Non-Billing") return ["fc-event--nonbillable"];
          return ["fc-event--overtime"];
        }}
        height="auto"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {editingEventId ? "Edit" : "Log"} hours for {formatDate(selectedDate)}
          {computeEnd() && <> – {formatDate(computeEnd())}</>}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Hours"
            type="number"
            inputProps={{ step: 0.25, min: 0 }}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            fullWidth
            margin="dense"
          />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            fullWidth
            margin="dense"
          >
            <MenuItem value="Billing">Billable</MenuItem>
            <MenuItem value="Non-Billing">Non‑Billable</MenuItem>
            <MenuItem value="Extra-Time">Overtime</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          {editingEventId && (
            <Button onClick={handleDelete} color="error">
              Delete
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!hours || isNaN(parseFloat(hours))}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <style>{`
        .fc-event--billable { background-color: #3f51b5; }
        .fc-event--nonbillable { background-color: #9e9e9e; }
        .fc-event--overtime { background-color: #f50057; }
      `}</style>
    </>
  );
}
