import React, { useEffect, useState } from "react";
import {
  getAdminUsers,
  getAdminTimesheets,
  getAdminRoles,
  setAdminUserRole,
} from "../lib/api";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function getCurrentRole(user) {
    return Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : "";
  }

  async function loadAdminData() {
    try {
      setError("");
      const [usersData, timesheetsData, rolesData] = await Promise.all([
        getAdminUsers(),
        getAdminTimesheets(),
        getAdminRoles(),
      ]);
      setUsers(usersData);
      setTimesheets(timesheetsData);
      setRoles(rolesData);
      setSelectedRoles(
        Object.fromEntries(usersData.map((u) => [u.id, getCurrentRole(u)]))
      );
    } catch (err) {
      console.error("Admin data load failed", err);
      setError("Failed to load admin data. Ensure you are an Admin or HR.");
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleSaveRole(userId) {
    try {
      setSavingUserId(userId);
      setMessage("");
      await setAdminUserRole(userId, selectedRoles[userId]);
      setMessage("Role updated successfully");
      await loadAdminData();
    } catch (err) {
      console.error("Failed to update role", err);
      setError("Failed to update role. Try again.");
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="page-shell">
      <section className="page-header">
        <div className="page-header-title">
          <h1>Admin Dashboard</h1>
        </div>
        <p className="page-subtitle">
          Review team access, monitor timesheet activity, and keep user roles visible without digging through separate tools.
        </p>
      </section>

      {error && <p className="status-message error">{error}</p>}
      {message && <p className="status-message">{message}</p>}

      <section className="panel">
        <h2>Users & Roles</h2>
        <p className="muted-text spacer-top">After a user logs in once, assign their role here. No database query needed.</p>
        <div className="table-wrap spacer-top">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Assign</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>
                  {u.first_name} {u.last_name}
                </td>
                <td>
                  <select
                    className="select-input"
                    value={selectedRoles[u.id] || ""}
                    onChange={(e) =>
                      setSelectedRoles((prev) => ({
                        ...prev,
                        [u.id]: e.target.value,
                      }))
                    }
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    className="button"
                    onClick={() => handleSaveRole(u.id)}
                    disabled={savingUserId === u.id || !selectedRoles[u.id]}
                  >
                    {savingUserId === u.id ? "Saving..." : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>

      <section className="panel">
        <h2>Timesheet Summary</h2>
        <div className="table-wrap spacer-top">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Week Start</th>
              <th>Status</th>
              <th>Total Hours</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.user_id}</td>
                <td>{new Date(t.week_start).toLocaleDateString()}</td>
                <td>{t.status}</td>
                <td>{Number(t.total_hours).toFixed(2)}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  );
}
