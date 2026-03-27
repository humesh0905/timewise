// src/routes/auth.js
import express from "express";
import passport from "passport";

const router = express.Router();

function sendLogoutResponse(req, res) {
  const acceptHeader = req.get("accept") || "";
  const isApiRequest =
    req.get("sec-fetch-mode") === "cors" ||
    acceptHeader.includes("application/json") ||
    req.query.format === "json";

  if (isApiRequest) {
    return res.json({ success: true });
  }

  return res.redirect("http://localhost:3000");
}

// ✅ Google OAuth route
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// ✅ Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000" }),
  (req, res) => {
    // ✅ redirect frontend after successful login
    res.redirect("http://localhost:3000/timesheets");
  }
);

// ✅ Logout
function logoutHandler(req, res) {
  req.logout((logoutErr) => {
    if (logoutErr) {
      console.error("❌ Logout error:", logoutErr);
      return res.status(500).json({ success: false, message: "Logout failed" });
    }

    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        console.error("❌ Session destroy error:", sessionErr);
        return res.status(500).json({ success: false, message: "Logout failed" });
      }

      res.clearCookie("connect.sid", {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      });

      return sendLogoutResponse(req, res);
    });
  });
}

router.get("/logout", logoutHandler);
router.post("/logout", logoutHandler);

// ✅ Check authentication status
router.get("/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
