require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple')(session);
const passport = require('./config/passport');
const { Pool } = require('pg');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ---------- DATABASE POOL ----------
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME, // fixed name
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// ---------- MIDDLEWARE ----------
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

const PgStore = connectPgSimple(session);

app.use(
  session({
    store: new PgStore({
      conObject: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      },
    }),
    secret: process.env.SESSION_SECRET || 'timewise_secret_123',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ---------- AUTH ROUTES ----------
app.use('/auth', authRoutes);

// ---------- TIMESHEET ROUTES ----------
app.get("/api/timesheets", async (req, res) => {
  const { userId, weekStart } = req.query;
  if (!userId || !weekStart) {
    return res.status(400).json({ error: "userId & weekStart required" });
  }

  try {
    const client = await pool.connect();
    const tsQ = `
      SELECT timesheet_id, status, created_at, updated_at
      FROM Timesheets
      WHERE user_id = $1 AND week_start = $2
    `;
    const tsRes = await client.query(tsQ, [userId, weekStart]);

    if (tsRes.rowCount === 0) {
      return res.json({ timesheet: null, entries: [] });
    }
    const timesheet = tsRes.rows[0];

    const eQ = `
      SELECT entry_id, start_time, end_time, entry_type, entry_status
      FROM TimesheetEntries
      WHERE timesheet_id = $1
      ORDER BY start_time
    `;
    const eRes = await client.query(eQ, [timesheet.timesheet_id]);

    res.json({
      timesheet,
      entries: eRes.rows
    });

    client.release();
  } catch (err) {
    console.error("GET /api/timesheets error:", err);
    res.status(500).json({ error: "Failed to fetch timesheet" });
  }
});


async function upsertWeek(userId, weekStart, entries, status) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const timesheetId = (await client.query(
      `INSERT INTO Timesheets(user_id, week_start, status)
         VALUES ($1,$2,$3)
       ON CONFLICT(user_id,week_start)
         DO UPDATE SET status=EXCLUDED.status, updated_at=NOW()
       RETURNING timesheet_id`,
      [userId, weekStart, status]
    )).rows[0].timesheet_id;

    for (const e of entries) {
      if (e.entry_id) {
        const updateRes = await client.query(
          `UPDATE TimesheetEntries
             SET start_time=$1, end_time=$2, entry_type=$3,
                 entry_status=$4, updated_at=NOW()
           WHERE entry_id=$5`,
          [e.start_time, e.end_time, e.entry_type, status, e.entry_id]
        );
        if (updateRes.rowCount === 0) {
          await client.query(
            `INSERT INTO TimesheetEntries
               (timesheet_id,start_time,end_time,entry_type,entry_status)
             VALUES($1,$2,$3,$4,$5)`,
            [timesheetId, e.start_time, e.end_time, e.entry_type, status]
          );
        }
      } else {
        await client.query(
          `INSERT INTO TimesheetEntries
             (timesheet_id,start_time,end_time,entry_type,entry_status)
           VALUES($1,$2,$3,$4,$5)`,
          [timesheetId, e.start_time, e.end_time, e.entry_type, status]
        );
      }
    }

    await client.query("COMMIT");
    return timesheetId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

app.post('/api/timesheets', async (req, res) => {
  const { userId, weekStart, entries } = req.body;
  if (!userId || !weekStart || !Array.isArray(entries)) {
    return res
      .status(400)
      .json({ error: 'Require userId, weekStart, entries[]' });
  }

  try {
    const timesheetId = await upsertWeek(userId, weekStart, entries, 'Saved');
    res.json({ timesheetId, status: 'Saved' });
  } catch (err) {
    console.error('Error saving draft:', err);
    res.status(500).json({ error: 'Failed to save timesheet draft' });
  }
});

app.post('/api/timesheets/submit', async (req, res) => {
  const { userId, weekStart, entries } = req.body;
  if (!userId || !weekStart || !Array.isArray(entries)) {
    return res
      .status(400)
      .json({ error: 'Require userId, weekStart, entries[]' });
  }

  try {
    const timesheetId = await upsertWeek(userId, weekStart, entries, 'Submitted');
    res.json({ timesheetId, status: 'Submitted' });
  } catch (err) {
    console.error('Error submitting timesheet:', err);
    res.status(500).json({ error: 'Failed to submit timesheet' });
  }
});

// ---------- SERVER ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
