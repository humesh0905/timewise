import express from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import checkRole from "../middleware/checkRole.js";

const router = express.Router();

// Admin summary: all users with roles
router.get(
  "/users",
  requireAuth,
  checkRole(["Admin", "Manager"]),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT u.id, u.email, u.first_name, u.last_name,
                  ARRAY_REMOVE(ARRAY_AGG(r.name), NULL) as roles
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         GROUP BY u.id
         ORDER BY u.email`
      );
      res.json(result.rows);
    } catch (err) {
      console.error("❌ Admin users error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Admin: list available roles for assignment
router.get(
  "/roles",
  requireAuth,
  checkRole(["Admin", "HR"]),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, name, description
         FROM roles
         ORDER BY name ASC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error("❌ Admin roles error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Admin: assign a primary role to a user from UI
router.put(
  "/users/:userId/role",
  requireAuth,
  checkRole(["Admin", "HR"]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { roleName } = req.body;

      if (!roleName) {
        return res.status(400).json({ message: "roleName is required" });
      }

      const userResult = await pool.query(
        `SELECT id FROM users WHERE id = $1`,
        [userId]
      );
      if (userResult.rowCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const roleResult = await pool.query(
        `SELECT id, name FROM roles WHERE name = $1`,
        [roleName]
      );
      if (roleResult.rowCount === 0) {
        return res.status(404).json({ message: "Role not found" });
      }

      await pool.query(`DELETE FROM user_roles WHERE user_id = $1`, [userId]);
      await pool.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)`,
        [userId, roleResult.rows[0].id]
      );

      return res.json({
        message: "Role updated successfully",
        userId: Number(userId),
        role: roleResult.rows[0].name,
      });
    } catch (err) {
      console.error("❌ Admin role update error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Admin summary: all timesheets
router.get(
  "/timesheets",
  requireAuth,
  checkRole(["Admin", "Manager"]),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT t.id, t.user_id, u.email, t.week_start, t.status, t.created_at,
                COALESCE(SUM(EXTRACT(EPOCH FROM (e.end_time - e.start_time)) / 3600), 0)::numeric as total_hours
         FROM timesheets t
         LEFT JOIN users u ON t.user_id = u.id
         LEFT JOIN timesheet_entries e ON t.id = e.timesheet_id
         GROUP BY t.id, u.email
         ORDER BY t.week_start DESC, t.id DESC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error("❌ Admin timesheets error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Admin report: total hours per user
router.get(
  "/reports/users",
  requireAuth,
  checkRole(["Admin", "Manager"]),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT u.id,
                u.email,
                u.first_name,
                u.last_name,
                COUNT(DISTINCT t.id) AS timesheet_count,
                COALESCE(SUM(EXTRACT(EPOCH FROM (e.end_time - e.start_time)) / 3600), 0)::numeric(10,2) AS total_hours
         FROM users u
         LEFT JOIN timesheets t ON t.user_id = u.id
         LEFT JOIN timesheet_entries e ON e.timesheet_id = t.id
         GROUP BY u.id
         ORDER BY total_hours DESC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error("❌ Admin report users error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Admin report: hours by week
router.get(
  "/reports/weekly",
  requireAuth,
  checkRole(["Admin", "Manager"]),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT t.week_start,
                COUNT(DISTINCT t.user_id) AS users_submitted,
                COALESCE(SUM(EXTRACT(EPOCH FROM (e.end_time - e.start_time)) / 3600), 0)::numeric(10,2) AS total_hours
         FROM timesheets t
         LEFT JOIN timesheet_entries e ON e.timesheet_id = t.id
         GROUP BY t.week_start
         ORDER BY t.week_start DESC`
      );

      res.json(result.rows);
    } catch (err) {
      console.error("❌ Admin report weekly error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Admin report: hours by project
router.get(
  "/reports/projects",
  requireAuth,
  checkRole(["Admin", "Manager", "HR", "Custom"]),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT p.id,
                p.name,
                p.code,
                COUNT(DISTINCT e.id) AS entry_count,
                COALESCE(SUM(EXTRACT(EPOCH FROM (e.end_time - e.start_time)) / 3600), 0)::numeric(10,2) AS total_hours
         FROM projects p
         LEFT JOIN timesheet_entries e ON e.project_id = p.id
         GROUP BY p.id, p.name, p.code
         ORDER BY total_hours DESC, p.name ASC`
      );

      res.json(result.rows);
    } catch (err) {
      console.error("❌ Admin report projects error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
