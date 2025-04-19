import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupRouter from "./pages/SignupRouter";
import MainMenu from "./pages/MainMenu";
import ManagerMenu from "./pages/ManagerMenu";
import AvailabilityPage from "./pages/AvailabilityPage";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ShiftSwapRequests from "./pages/ShiftSwapRequests";
import ManagerRecapPage from "./pages/ManagerRecapPage";
import api from "./services/api";
import "./index.css";    // or wherever your global styles live

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // helper to load current user's role
  const fetchUserRole = useCallback(async () => {
    const { data } = await api.get("/api/users/me/");
    setUserRole(data.role);
  }, []);

  // on mount: detect token, set isLoggedIn
  useEffect(() => {
    const access = document.cookie
      .split("; ")
      .find((c) => c.startsWith("access="))
      ?.split("=")[1];
    if (access) {
      setIsLoggedIn(true);
    }
  }, []);

  // whenever we log in or sign up, or when the page reloads and isLoggedIn=true,
  // fetch the userRole
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserRole();
    }
  }, [isLoggedIn, fetchUserRole]);

  const handleLogin = async () => {
    setIsLoggedIn(true);
    await fetchUserRole();
  };
  const handleSignup = async () => {
    setIsLoggedIn(true);
    await fetchUserRole();
  };

  const handleLogout = async () => {
    const refresh = document.cookie
      .split("; ")
      .find((row) => row.startsWith("refresh="))
      ?.split("=")[1];
    try {
      if (refresh) {
        await api.post("/api/logout/", { refresh });
      }
    } catch (err) {
      console.warn("Logout API error (token may be expired):", err);
    } finally {
      // Always clear cookies & state
      document.cookie = "access=; Max-Age=0; path=/";
      document.cookie = "refresh=; Max-Age=0; path=/";
      setIsLoggedIn(false);
      setUserRole(null);
    }
  };

  return (
    <Router>
      <div className="app-container">   {/* ← new wrapper */}
        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn
                ? (userRole === "manager"
                  ? <ManagerMenu onLogout={handleLogout} />
                  : <MainMenu onLogout={handleLogout} />)
                : <Navigate to="/sign-up" replace />
            }
          />

          {/* Sign‑Up & Login */}
          <Route path="/sign-up" element={<SignupRouter onSignup={handleSignup} />} />
          <Route
            path="/sign-in"
            element={
              isLoggedIn
                ? <Navigate to="/" replace />
                : <LoginPage onLogin={handleLogin}/>
            }
          />

          {/* availability – same for both roles */}
          <Route
            path="/availability"
            element={isLoggedIn ? <AvailabilityPage /> : <Navigate to="/sign-in" />}
          />

          {/* employee dashboard */}
          <Route
            path="/employee-dashboard"
            element={isLoggedIn ? <EmployeeDashboard /> : <Navigate to="/sign-in" />}
          />

          {/* manager recap */}
          <Route
            path="/manager-recap"
            element={
              isLoggedIn && userRole === "manager" ? (
                <ManagerRecapPage />
              ) : (
                <Navigate to="/sign-in" />
              )
            }
          />

          {/* shift swaps */}
          <Route
            path="/shift-swaps"
            element={isLoggedIn ? <ShiftSwapRequests /> : <Navigate to="/sign-in" />}
          />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
