import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ShiftPlanner from "./pages/ShiftPlanner";
import MainMenu from "./pages/MainMenu";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import api from "./services/api";
import ShiftSwapRequests from "./pages/ShiftSwapRequests";
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // set this based on actual token check later

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout/");
    } catch (error) {
      console.error("Logout failed:", error);
    }

    document.cookie = "access=; Max-Age=0";
    document.cookie = "refresh=; Max-Age=0";
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-black text-white">
        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <MainMenu onLogout={handleLogout} />
              ) : (
                <LoginPage onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/shift-planner"
            element={isLoggedIn ? <ShiftPlanner /> : <Navigate to="/" />}
          />
          <Route
            path="/employee-dashboard"
            element={isLoggedIn ? <EmployeeDashboard /> : <Navigate to="/" />}
          />
          <Route path="/shift-swaps" element={isLoggedIn ? <ShiftSwapRequests /> : <Navigate to="/" />} />
          <Route
            path="*"
            element={<Navigate to="/" />} // Redirect unknown routes to Main Menu
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
