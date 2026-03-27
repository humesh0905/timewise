// src/app.js
import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import dotenv from "dotenv";
import timesheetRoutes from "./routes/timesheet.js";
import projectsRoutes from "./routes/projects.js";
import adminRoutes from "./routes/admin.js";
import checkRole from "./middleware/checkRole.js";
import { requireAuth } from "./middleware/auth.js";


dotenv.config();

const app = express();

// ✅ Parse JSON
app.use(express.json());

// ✅ CORS setup for frontend (React app on port 3000)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, // crucial for cookies
  })
);

// ✅ Express session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true if using https
      sameSite: "lax", // allows cross-site cookies between 3000↔8080
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// ✅ Initialize Passport
import "./config/passport.js";
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/timesheets", timesheetRoutes);


// ✅ Routes
app.use("/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/profile", profileRoutes); // optional legacy
app.use("/api/projects", projectsRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("✅ TimeWise API running on port 8080");
});

export default app;
