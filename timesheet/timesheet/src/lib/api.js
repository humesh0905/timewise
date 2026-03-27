// src/lib/api.js

// 🔧 Point directly at the backend container on port 8080
// (works both with and without Docker, since the browser talks to localhost)
const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:8080/api";

/**
 * Helper to always send cookies (session) with requests.
 */
async function fetchJson(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const res = await fetch(url, {
    credentials: "include", // send session cookie
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("❌ API error", {
      url,
      status: res.status,
      statusText: res.statusText,
      body: text,
    });
    throw new Error(
      `Request to ${url} failed: ${res.status} ${res.statusText} - ${text}`
    );
  }

  // Some endpoints might return 204 No Content
  if (res.status === 204) return null;

  return res.json();
}

// ✅ Get list of projects for the dropdown
export async function getProjects() {
  const data = await fetchJson("/projects");

  if (!Array.isArray(data)) {
    console.warn("Unexpected /projects response shape:", data);
    return [];
  }

  // Make sure we always return { id, name }
  return data.map((p) => ({
    id: p.id,
    name: p.name,
  }));
}

export async function getProjectTasks(projectId) {
  if (!projectId) return [];
  const data = await fetchJson(`/projects/${projectId}/tasks`);
  return Array.isArray(data) ? data : [];
}

// ✅ Load entries for a given week (all projects)
export async function getTimesheetEntries(weekStart) {
  return fetchJson(`/timesheets/${weekStart}/entries`);
}

// ✅ Save timesheet for a given project
export async function saveTimesheet(weekStart, projectName, entries, taskId = null) {
  const body = {
    week_start: weekStart,
    project: projectName, // backend expects project NAME
    task_id: taskId,
    entries, // 
  };

  return fetchJson("/timesheets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ✅ Update a single entry
export async function updateTimesheetEntry(entryId, hours) {
  return fetchJson(`/timesheets/entries/${entryId}`, {
    method: "PUT",
    body: JSON.stringify({ hours }),
  });
}

// ✅ Delete a single entry
export async function deleteTimesheetEntry(entryId) {
  return fetchJson(`/timesheets/entries/${entryId}`, {
    method: "DELETE",
  });
}

// ✅ Admin: fetch all users with roles
export async function getAdminUsers() {
  return fetchJson("/admin/users");
}

// ✅ Admin: fetch all timesheet summaries
export async function getAdminTimesheets() {
  return fetchJson("/admin/timesheets");
}

export async function getAdminRoles() {
  return fetchJson("/admin/roles");
}

export async function setAdminUserRole(userId, roleName) {
  return fetchJson(`/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ roleName }),
  });
}

export async function getAdminUsersReport() {
  return fetchJson("/admin/reports/users");
}

export async function getAdminWeeklyReport() {
  return fetchJson("/admin/reports/weekly");
}

export async function getAdminProjectsReport() {
  return fetchJson("/admin/reports/projects");
}
