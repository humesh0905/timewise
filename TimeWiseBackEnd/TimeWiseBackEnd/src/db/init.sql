-- ===============================
-- TimeWise Database Initialization Script (Fixed Sequences)
-- ===============================

DROP TABLE IF EXISTS public.timesheet_entries CASCADE;
DROP TABLE IF EXISTS public.timesheets CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- USERS TABLE
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- PROJECTS TABLE
CREATE TABLE public.projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- TIMESHEETS TABLE
CREATE TABLE public.timesheets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_user_week UNIQUE (user_id, week_start)
);

-- TIMESHEET ENTRIES TABLE
CREATE TABLE public.timesheet_entries (
    id SERIAL PRIMARY KEY,
    timesheet_id INTEGER NOT NULL REFERENCES public.timesheets(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES public.projects(id),
    entry_date DATE NOT NULL,
    hours NUMERIC(4,1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_timesheet_entry UNIQUE (timesheet_id, entry_date, project_id)
);

-- ===============================
-- SEED DATA
-- ===============================
INSERT INTO public.users (id, name, email) VALUES
(1, 'Test User', 'testuser@gmail.com'),
(2, 'Manager User', 'manager@gmail.com');

INSERT INTO public.projects (id, name) VALUES
(1, 'Project Alpha'),
(2, 'Project Beta'),
(3, 'Project Gamma');

INSERT INTO public.timesheets (id, user_id, week_start)
VALUES (1, 1, DATE_TRUNC('week', CURRENT_DATE)::DATE);

INSERT INTO public.timesheet_entries (timesheet_id, project_id, entry_date, hours)
VALUES 
(1, 1, CURRENT_DATE - INTERVAL '1 day', 8.0),
(1, 2, CURRENT_DATE - INTERVAL '2 days', 6.5);

-- ===============================
-- RESET SEQUENCES
-- ===============================
SELECT setval(pg_get_serial_sequence('public.users', 'id'), COALESCE(MAX(id), 1)) FROM public.users;
SELECT setval(pg_get_serial_sequence('public.projects', 'id'), COALESCE(MAX(id), 1)) FROM public.projects;
SELECT setval(pg_get_serial_sequence('public.timesheets', 'id'), COALESCE(MAX(id), 1)) FROM public.timesheets;
SELECT setval(pg_get_serial_sequence('public.timesheet_entries', 'id'), COALESCE(MAX(id), 1)) FROM public.timesheet_entries;

-- ===============================
-- INDEXES
-- ===============================
CREATE INDEX idx_timesheets_user_id ON public.timesheets(user_id);
CREATE INDEX idx_entries_timesheet_id ON public.timesheet_entries(timesheet_id);
CREATE INDEX idx_entries_project_id ON public.timesheet_entries(project_id);
