// src/index.js
import dotenv from "dotenv";

// Load environment variables as early as possible
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 8080;

// Basic health log so we know the process actually started
console.log("Starting TimeWise API…");

// Start the HTTP server
const server = app.listen(PORT, () => {
  console.log(`✅ TimeWise API running on port ${PORT}`);
});

// Optional: log and exit on unexpected errors so Docker logs show them clearly
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  server.close(() => {
    process.exit(1);
  });
});
