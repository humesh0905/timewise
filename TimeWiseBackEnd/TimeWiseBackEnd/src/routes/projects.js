// src/routes/projects.js
import express from "express";
import pool from "../db/pool.js";

const router = express.Router();

// GET /api/projects
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM public.projects ORDER BY name ASC"
    );

    // Example result: [ { id: 1, name: 'Project Alpha' }, ... ]
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error loading projects:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/projects/:projectId/tasks
router.get("/:projectId/tasks", async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT id, name, code
       FROM public.tasks
       WHERE project_id = $1 AND is_active = true
       ORDER BY name ASC`,
      [projectId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error loading project tasks:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
