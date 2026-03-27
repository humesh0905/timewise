import React from 'react';

export default function Login() {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/auth/google';
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <section className="login-hero">
          <div className="login-eyebrow">TimeWise Workspace</div>
          <div>
            <h1>Track work without the clutter.</h1>
            <p className="login-copy spacer-top">
              A simpler timesheet, reporting, and admin workspace for teams that just need the essentials done cleanly.
            </p>
          </div>
          <p className="login-copy">
            Login uses your Google account and keeps your session active across the app.
          </p>
        </section>

        <section className="login-panel">
          <div>
            <h2>Sign in</h2>
            <p className="login-meta spacer-top">
              Continue with Google to access timesheets, profile details, reports, and the holiday calendar.
            </p>
          </div>

          <button className="button" onClick={handleGoogleLogin}>
            Sign in with Google
          </button>
        </section>
      </div>
    </div>
  );
}
