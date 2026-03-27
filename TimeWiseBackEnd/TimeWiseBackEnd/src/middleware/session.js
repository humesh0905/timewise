// src/middleware/session.js
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const pgPool = new Pool({
  host: process.env.DB_HOST || 'timewise_postgres',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'timewise',
});

const sessionMiddleware = session({
  store: new pgSession({
    pool: pgPool,
    tableName: 'session',
  }),
  secret: process.env.SESSION_SECRET || 'timewise_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false, // ❗ must be false for localhost (true only in HTTPS)
    sameSite: 'lax', // allow cookies across localhost:3000 ↔ localhost:8080
  },
});

module.exports = sessionMiddleware;
