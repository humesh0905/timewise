// src/routes/profile.js
import express from "express";
import bcrypt from "bcrypt";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET profile
router.get("/", requireAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const result = await pool.query(
      "SELECT id, email, first_name, last_name, timezone, department, title FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("❌ Error loading profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT profile (update user info)
router.put("/", requireAuth, async (req, res) => {
  try {
    console.log('[Profile PUT] req.user:', req.user);
    console.log('[Profile PUT] body:', req.body);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { first_name, last_name, timezone, department, title } = req.body;

    if (first_name == null && last_name == null && timezone == null && department == null && title == null) {
      return res.status(400).json({ message: "No profile fields provided" });
    }

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           timezone = COALESCE($3, timezone),
           department = COALESCE($4, department),
           title = COALESCE($5, title),
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, first_name, last_name, timezone, department, title`,
      [first_name, last_name, timezone, department, title, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.rows[0], message: "Profile updated successfully" });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT profile password (for local-password users or set password for OAuth accounts)
router.put("/password", requireAuth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const userRes = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const storedHash = userRes.rows[0].password_hash;

    if (storedHash) {
      if (!current_password) {
        return res.status(400).json({ message: "Current password is required" });
      }

      const match = await bcrypt.compare(current_password, storedHash);
      if (!match) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
    }

    const hashed = await bcrypt.hash(new_password, 12);
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hashed, req.user.id]
    );
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Error updating password:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
