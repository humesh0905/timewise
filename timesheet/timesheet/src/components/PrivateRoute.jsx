import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

/**
 * Protects routes by verifying backend session on mount.
 * Redirects to login if user not authenticated.
 */
const PrivateRoute = ({ children }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check auth status from backend
    fetch("http://localhost:8080/auth/status", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(data.authenticated);
        setAuthChecked(true);
      })
      .catch((err) => {
        console.error("Auth check failed:", err);
        setAuthChecked(true);
      });
  }, []);

  if (!authChecked) {
    return <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
