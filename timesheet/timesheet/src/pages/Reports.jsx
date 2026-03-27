import React, { useEffect, useState } from "react";
import {
  getAdminUsersReport,
  getAdminWeeklyReport,
  getAdminProjectsReport,
} from "../lib/api";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? "");
          const escaped = str.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function MiniBars({ title, data, labelKey, valueKey, valueColor }) {
  const safeData = data.slice(0, 8);
  const maxVal = Math.max(...safeData.map((d) => toNumber(d[valueKey])), 1);

  return (
    <div className="data-card">
      <h3>{title}</h3>
      <div className="metric-list spacer-top">
        {safeData.map((item, idx) => {
          const value = toNumber(item[valueKey]);
          const widthPercent = (value / maxVal) * 100;
          const label = String(item[labelKey] ?? "-");

          return (
            <div className="metric-row" key={`${label}-${idx}`}>
              <div className="metric-head">
                <span>{label}</span>
                <span>{value.toFixed(2)}</span>
              </div>
              <div className="metric-bar">
                <div
                  className="metric-bar-fill"
                  style={{
                    width: `${widthPercent}%`,
                    background: valueColor,
                    transition: "width 300ms ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Reports() {
  const [usersReport, setUsersReport] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState([]);
  const [projectsReport, setProjectsReport] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        setError("");
        const [usersData, weeklyData, projectsData] = await Promise.all([
          getAdminUsersReport(),
          getAdminWeeklyReport(),
          getAdminProjectsReport(),
        ]);
        setUsersReport(usersData);
        setWeeklyReport(weeklyData);
        setProjectsReport(projectsData);
      } catch (err) {
        console.error("Failed to load reports", err);
        setError("Failed to load reports. Verify you are Admin/Manager.");
      }
    }

    loadReports();
  }, []);

  const totals = {
    users: usersReport.length,
    submittedWeeks: weeklyReport.length,
    allHours: weeklyReport.reduce((sum, item) => sum + toNumber(item.total_hours), 0),
  };

  const userCsvRows = [
    ["email", "first_name", "last_name", "timesheet_count", "total_hours"],
    ...usersReport.map((u) => [
      u.email,
      u.first_name || "",
      u.last_name || "",
      toNumber(u.timesheet_count),
      toNumber(u.total_hours),
    ]),
  ];

  const weeklyCsvRows = [
    ["week_start", "users_submitted", "total_hours"],
    ...weeklyReport.map((w) => [
      new Date(w.week_start).toISOString().slice(0, 10),
      toNumber(w.users_submitted),
      toNumber(w.total_hours),
    ]),
  ];

  const usersChartData = usersReport
    .slice(0, 8)
    .map((u) => ({
      label: (u.first_name || u.email || "User").slice(0, 16),
      hours: toNumber(u.total_hours),
    }));

  const weeklyChartData = weeklyReport
    .slice(0, 8)
    .map((w) => ({
      label: new Date(w.week_start).toLocaleDateString(),
      hours: toNumber(w.total_hours),
    }));

  return (
    <div className="page-shell">
      <section className="page-header">
        <div className="page-header-title">
          <h1>Reports</h1>
        </div>
        <p className="page-subtitle">Live analytics for admins and managers with a simpler overview of people, weekly activity, and projects.</p>
      </section>

      {error && <p className="status-message error">{error}</p>}

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Active Users in Report</div>
          <div className="kpi-value">{totals.users}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Weeks Submitted</div>
          <div className="kpi-value">{totals.submittedWeeks}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Hours</div>
          <div className="kpi-value">{totals.allHours.toFixed(2)}</div>
        </div>
      </section>

      <section className="toolbar-wrap">
        <button
          className="button"
          onClick={() => downloadCsv("users_report.csv", userCsvRows)}
        >
          Export Users CSV
        </button>
        <button
          className="button"
          onClick={() => downloadCsv("weekly_report.csv", weeklyCsvRows)}
        >
          Export Weekly CSV
        </button>
        <button className="ghost-button" onClick={() => window.print()}>
          Export PDF (Print)
        </button>
      </section>

      <section className="grid-2">
        <MiniBars
          title="Top Users by Hours"
          data={usersChartData}
          labelKey="label"
          valueKey="hours"
          valueColor="#0f766e"
        />
        <MiniBars
          title="Weekly Hours Trend"
          data={weeklyChartData}
          labelKey="label"
          valueKey="hours"
          valueColor="#0e7490"
        />
      </section>

      <section className="panel">
        <h2>Users Report</h2>
        <div className="table-wrap spacer-top">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Timesheets</th>
              <th>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {usersReport.map((user) => (
              <tr key={user.id}>
                <td>
                  {user.first_name || ""} {user.last_name || ""} ({user.email})
                </td>
                <td>{user.timesheet_count}</td>
                <td>{user.total_hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>

      <section className="panel">
        <h2>Weekly Report</h2>
        <div className="table-wrap spacer-top">
        <table className="data-table">
          <thead>
            <tr>
              <th>Week Start</th>
              <th>Users Submitted</th>
              <th>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {weeklyReport.map((item) => (
              <tr key={item.week_start}>
                <td>{new Date(item.week_start).toLocaleDateString()}</td>
                <td>{item.users_submitted}</td>
                <td>{item.total_hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>

      <section className="panel">
        <h2>Project Tracking</h2>
        <div className="table-wrap spacer-top">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Code</th>
              <th>Entries</th>
              <th>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {projectsReport.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.code || "-"}</td>
                <td>{item.entry_count}</td>
                <td>{item.total_hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  );
}
