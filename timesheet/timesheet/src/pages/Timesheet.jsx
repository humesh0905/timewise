// src/pages/Timesheet.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getProjects,
  getProjectTasks,
  getTimesheetEntries,
  saveTimesheet,
  updateTimesheetEntry,
  deleteTimesheetEntry,
} from "../lib/api";

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun, 1 = Mon ...
  const diff = (day === 0 ? -6 : 1) - day; // make Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatISODate(d) {
  return d.toISOString().slice(0, 10);
}

function getWeekDates(weekStartDate) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    return d;
  });
}

const weekdayLabel = (d) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export default function Timesheet() {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current
  const [entries, setEntries] = useState({});
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const weekStartDate = useMemo(() => {
    const today = new Date();
    const startOfWeek = getStartOfWeek(today);
    startOfWeek.setDate(startOfWeek.getDate() + weekOffset * 7);
    return startOfWeek;
  }, [weekOffset]);

  const weekDates = useMemo(
    () => getWeekDates(weekStartDate),
    [weekStartDate]
  );

  const weekStartISO = useMemo(
    () => formatISODate(weekStartDate),
    [weekStartDate]
  );

  const selectedProject = useMemo(
    () => projects.find((p) => String(p.id) === String(selectedProjectId)),
    [projects, selectedProjectId]
  );

  const totalHours = useMemo(
    () =>
      Object.values(entries).reduce(
        (sum, v) => sum + (Number(v.hours) || 0),
        0
      ),
    [entries]
  );

  // 🔹 1. Load projects on first render
  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setError("");
        const list = await getProjects();
        if (!active) return;

        setProjects(list);

        // Auto-select the first project if available
        if (list.length > 0) {
          setSelectedProjectId(String(list[0].id));
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
        if (active) {
          setError("Failed to load projects");
        }
      }
    }

    loadProjects();
    return () => {
      active = false;
    };
  }, []);

  // 🔹 1.1 Load tasks whenever project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      setSelectedTaskId("");
      return;
    }

    let active = true;
    async function loadTasks() {
      try {
        const list = await getProjectTasks(selectedProjectId);
        if (!active) return;
        setTasks(list);
        setSelectedTaskId(list.length > 0 ? String(list[0].id) : "");
      } catch (err) {
        console.error("Failed to load tasks:", err);
        if (active) {
          setTasks([]);
          setSelectedTaskId("");
        }
      }
    }

    loadTasks();
    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  // 🔹 2. Load timesheet entries whenever week or project changes
  useEffect(() => {
    if (!selectedProjectId) {
      // We have no project yet; nothing to load
      setEntries({});
      return;
    }

    let active = true;

    async function loadEntries() {
      try {
        setLoading(true);
        setError("");

        const data = await getTimesheetEntries(weekStartISO);
        if (!active) return;

        // data rows are: { id, entry_date, hours, project }
        const projectName = selectedProject?.name;

        const forProject = projectName
          ? data.filter((row) => row.project === projectName)
          : data;

        const forTask = selectedTaskId
          ? forProject.filter((row) => String(row.task_id || "") === String(selectedTaskId))
          : forProject;

        const grouped = {};
        forTask.forEach((row) => {
          const iso = row.entry_date.slice(0, 10);
          grouped[iso] = { id: row.id, hours: Number(row.hours) || 0 };
        });

        setEntries(grouped);
      } catch (err) {
        console.error("Failed to load timesheet entries:", err);
        if (active) {
          setError("Failed to load timesheet entries");
          setEntries({});
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEntries();
    return () => {
      active = false;
    };
  }, [weekStartISO, selectedProjectId, selectedProject, selectedTaskId]);

  function handleHourChange(dateISO, value) {
    setEntries((prev) => ({
      ...prev,
      [dateISO]: {
        id: prev[dateISO]?.id,
        hours: value === "" ? "" : Number(value),
      },
    }));
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!selectedProject) {
      setError("Please select a project");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Build payload entries: { 'YYYY-MM-DD': { hours } }
      const payload = {};
      weekDates.forEach((d) => {
        const iso = formatISODate(d);
        const val = entries[iso];
        const hoursNum = Number(val?.hours || 0);
        if (hoursNum > 0) {
          payload[iso] = { hours: hoursNum };
        }
      });

      await saveTimesheet(
        weekStartISO,
        selectedProject.name,
        payload,
        selectedTaskId ? Number(selectedTaskId) : null
      );
      alert("Timesheet saved!");
    } catch (err) {
      console.error("Failed to save timesheet:", err);
      setError("Failed to save timesheet");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(dateISO) {
    const entry = entries[dateISO];
    if (!entry?.id) {
      return;
    }

    const hoursNum = Number(entry.hours || 0);
    if (Number.isNaN(hoursNum) || hoursNum < 0) {
      setError("Invalid hours value");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await updateTimesheetEntry(entry.id, hoursNum);
      alert("Entry updated");
    } catch (err) {
      console.error("Failed to update entry:", err);
      setError("Failed to update entry");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(dateISO) {
    const entry = entries[dateISO];
    if (!entry?.id) return;

    try {
      setLoading(true);
      setError("");
      await deleteTimesheetEntry(entry.id);
      setEntries((prev) => {
        const next = { ...prev };
        delete next[dateISO];
        return next;
      });
      alert("Entry deleted");
    } catch (err) {
      console.error("Failed to delete entry:", err);
      setError("Failed to delete entry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <section className="page-header">
        <div className="page-header-title">
          <h1>My Timesheet</h1>
          <div className="toolbar">
            <button className="ghost-button" onClick={() => setWeekOffset((o) => o - 1)}>
              Prev
            </button>
            <button className="ghost-button" onClick={() => setWeekOffset((o) => o + 1)}>
              Next
            </button>
          </div>
        </div>
        <p className="page-subtitle">
          Log the week in one place, keep the hours simple, and update individual days only when needed.
        </p>
      </section>

      <section className="panel">
        <div className="toolbar toolbar-spread">
          <div className="control-group">
            <div className="field">
              <label>Week</label>
              <div className="muted-text">
                {weekDates[0]?.toLocaleDateString()} - {weekDates[6]?.toLocaleDateString()}
              </div>
            </div>

            <div className="field">
              <label htmlFor="project-select">Project</label>
              <select
                id="project-select"
                className="select-input"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.length === 0 && <option value="">(no projects)</option>}
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="task-select">Task</label>
              <select
                id="task-select"
                className="select-input"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
              >
                {tasks.length === 0 && <option value="">(no tasks)</option>}
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Total hours this week</div>
            <div className="kpi-value">{totalHours.toFixed(1)}</div>
          </div>
        </div>

        {error && <p className="status-message error spacer-top">{error}</p>}

        {!error && !selectedProjectId && projects.length > 0 && (
          <p className="muted-text spacer-top">Please select a project to begin.</p>
        )}

        <form className="timesheet-grid spacer-top" onSubmit={handleSave}>
        {weekDates.map((date) => {
          const iso = formatISODate(date);
          const value = entries[iso]?.hours ?? "";

          return (
            <div key={iso} className="timesheet-row">
              <span>{weekdayLabel(date)}</span>
              <input
                className="number-input small"
                type="number"
                min="0"
                step="0.5"
                value={value}
                onChange={(e) => handleHourChange(iso, e.target.value)}
              />
              <span>hrs</span>
              <div className="timesheet-actions">
                {entries[iso]?.id && (
                  <>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => handleUpdate(iso)}
                    disabled={loading}
                  >
                    Update
                  </button>
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => handleDelete(iso)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        <div className="toolbar toolbar-spread spacer-top">
          <div className="muted-text">
            Changes save to the selected project and task for this week.
          </div>

          <button
            className="button"
            type="submit"
            disabled={loading || !selectedProject}
          >
            {loading ? "Saving..." : "Save Timesheet"}
          </button>
        </div>
      </form>
      </section>
    </div>
  );
}
