import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// ✅ Configure pool and ensure correct schema visibility
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Ensure schema is always visible (critical fix for ON CONFLICT)
pool.on("connect", (client) => {
  client.query('SET search_path TO public');
});

// ✅ Ensure user is authenticated (from Passport/session)
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
});

// ✅ Fetch all timesheets
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id,
              t.week_start,
              COALESCE(SUM(EXTRACT(EPOCH FROM (e.end_time - e.start_time)) / 3600), 0)::numeric(10,2) AS total_hours,
              t.created_at
       FROM public.timesheets t
       LEFT JOIN public.timesheet_entries e ON t.id = e.timesheet_id
       WHERE t.user_id = $1
       GROUP BY t.id, t.week_start, t.created_at
       ORDER BY t.week_start DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching timesheets:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Create or update a timesheet
router.post("/", async (req, res) => {
  try {
    const { week_start, project, task_id, entries } = req.body;
    if (!week_start || !entries) {
      return res.status(400).json({ message: "Missing week_start or entries" });
    }

    let projectId = null;
    if (project) {
      const projectResult = await pool.query(
        `SELECT id FROM public.projects WHERE name = $1 OR code = $1 LIMIT 1`,
        [project]
      );
      projectId = projectResult.rows[0]?.id ?? null;
    }

    let taskId = task_id ?? null;
    if (taskId) {
      const taskResult = await pool.query(
        `SELECT id FROM public.tasks WHERE id = $1`,
        [taskId]
      );
      if (taskResult.rows.length === 0) {
        taskId = null;
      }
    }

    // 🔹 Ensure timesheet exists (check first, then create if needed)
    let ts = await pool.query(
      `SELECT id FROM public.timesheets
       WHERE user_id = $1 AND week_start = $2`,
      [req.user.id, week_start]
    );

    let timesheetId;
    if (ts.rows.length > 0) {
      timesheetId = ts.rows[0].id;
    } else {
      const insertTs = await pool.query(
        `INSERT INTO public.timesheets (user_id, week_start)
         VALUES ($1, $2)
         RETURNING id`,
        [req.user.id, week_start]
      );
      timesheetId = insertTs.rows[0].id;
    }

    // 🔹 Insert or update entries safely
    for (const [date, val] of Object.entries(entries)) {
      const hoursNum = val.hours || 0;
      if (hoursNum <= 0) continue; // skip zero hours

      // Convert date + hours into start_time and end_time
      const startTime = new Date(`${date}T09:00:00Z`);
      const endTime = new Date(startTime.getTime() + hoursNum * 3600000);

      // Check if entry exists for this date (same project/task granularity)
      const existing = await pool.query(
        `SELECT id FROM public.timesheet_entries
         WHERE timesheet_id = $1
           AND DATE(start_time AT TIME ZONE 'UTC') = $2
           AND COALESCE(project_id, 0) = COALESCE($3, 0)
           AND COALESCE(task_id, 0) = COALESCE($4, 0)`,
        [timesheetId, date, projectId, taskId]
      );

      if (existing.rows.length > 0) {
        // Update existing
        await pool.query(
          `UPDATE public.timesheet_entries
           SET start_time = $1,
               end_time = $2,
               entry_type = $3,
               project_id = $4,
               task_id = $5,
               entry_status = 'Saved'
           WHERE id = $6`,
          [startTime, endTime, "Work", projectId, taskId, existing.rows[0].id]
        );
      } else {
        // Insert new
        await pool.query(
          `INSERT INTO public.timesheet_entries (timesheet_id, start_time, end_time, entry_type, entry_status, project_id, task_id)
           VALUES ($1, $2, $3, $4, 'Saved', $5, $6)`,
          [timesheetId, startTime, endTime, "Work", projectId, taskId]
        );
      }
    }

    console.log(`✅ Timesheet saved successfully for ${req.user.email}`);
    res.json({ message: "✅ Timesheet saved successfully" });
  } catch (err) {
    console.error("❌ Error saving timesheet:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Fetch entries for a specific week
router.get("/:week_start/entries", async (req, res) => {
  try {
    const { week_start } = req.params;
    const result = await pool.query(
      `SELECT 
        e.id,
        DATE(e.start_time AT TIME ZONE 'UTC') AS entry_date,
        EXTRACT(EPOCH FROM (e.end_time - e.start_time)) / 3600 AS hours,
        e.entry_type,
        e.entry_status,
        e.timesheet_id,
        e.project_id,
        p.name AS project,
        e.task_id,
        tk.name AS task
       FROM public.timesheet_entries e
       JOIN public.timesheets t ON e.timesheet_id = t.id
       LEFT JOIN public.projects p ON e.project_id = p.id
       LEFT JOIN public.tasks tk ON e.task_id = tk.id
       WHERE t.user_id = $1 AND t.week_start = $2
       ORDER BY e.start_time ASC`,
      [req.user.id, week_start]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching entries:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Update a single entry (hours)
router.put("/entries/:entryId", async (req, res) => {
  try {
    const { entryId } = req.params;
    const { hours } = req.body;

    if (typeof hours !== "number" || hours < 0) {
      return res.status(400).json({ message: "Invalid hours" });
    }

    const entryResult = await pool.query(
      `SELECT start_time
       FROM public.timesheet_entries
       WHERE id = $1`,
      [entryId]
    );

    if (entryResult.rowCount === 0) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const startTime = new Date(entryResult.rows[0].start_time);
    const endTime = new Date(startTime.getTime() + hours * 3600000);

    const updateResult = await pool.query(
      `UPDATE public.timesheet_entries
       SET end_time = $1
       WHERE id = $2
       RETURNING *`,
      [endTime, entryId]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error("❌ Error updating entry:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Delete a single entry
router.delete("/entries/:entryId", async (req, res) => {
  try {
    const { entryId } = req.params;
    const deleteResult = await pool.query(
      "DELETE FROM public.timesheet_entries WHERE id = $1",
      [entryId]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("❌ Error deleting entry:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
