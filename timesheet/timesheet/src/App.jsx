import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Timesheet from "./pages/Timesheet";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Reports from "./pages/Reports";
import Calendar from "./pages/Calendar";
import PrivateLayout from "./layouts/PrivateLayout";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Check authentication status from backend
  useEffect(() => {
    fetch("http://localhost:8080/auth/status", {
      credentials: "include", // include session cookie
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Auth check failed:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <h3>Checking authentication...</h3>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ✅ Public route */}
          <Route path="/" element={user ? <Navigate to="/timesheets" /> : <Login />} />

          {/* ✅ Protected routes inside layout */}
          <Route
            path="/timesheets"
            element={
              user ? (
                <PrivateLayout>
                  <Timesheet user={user} />
                </PrivateLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/admin"
            element={
              user ? (
                <PrivateLayout>
                  <Admin user={user} />
                </PrivateLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/profile"
            element={
              user ? (
                <PrivateLayout>
                  <Profile user={user} />
                </PrivateLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/reports"
            element={
              user ? (
                <PrivateLayout>
                  <Reports user={user} />
                </PrivateLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/calendar"
            element={
              user ? (
                <PrivateLayout>
                  <Calendar user={user} />
                </PrivateLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* ✅ Catch-all redirect */}
          <Route path="*" element={<Navigate to={user ? "/timesheets" : "/"} />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
