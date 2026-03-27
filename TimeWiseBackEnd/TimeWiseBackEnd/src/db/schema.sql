-- ✅ Users table (needed for FK)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ✅ Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ✅ Timesheets table (1 per user/week)
CREATE TABLE IF NOT EXISTS timesheets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

-- ✅ Timesheet entries (daily)
CREATE TABLE IF NOT EXISTS timesheet_entries (
  id SERIAL PRIMARY KEY,
  timesheet_id INTEGER REFERENCES timesheets(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id),
  entry_date DATE NOT NULL,
  hours NUMERIC(4,1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (timesheet_id, entry_date, project_id)
);
