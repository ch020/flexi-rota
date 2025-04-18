import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ShiftPlanner from "./pages/ShiftPlanner";
import MainMenu from "./pages/MainMenu";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ShiftSwapRequests from "./pages/ShiftSwapRequests";
import api from "./services/api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const access = document.cookie
      .split("; ")
      .find(row => row.startsWith("access="))
      ?.split("=")[1];
    setIsLoggedIn(!!access);
  }, []);

  const handleLogin = () => setIsLoggedIn(true);
  const handleSignup = () => setIsLoggedIn(true);
  const handleLogout = async () => {
    const refresh = document.cookie
      .split("; ")
      .find(row => row.startsWith("refresh="))
      ?.split("=")[1];
    if (refresh) await api.post("/api/logout/", { refresh });
    document.cookie = "access=; Max-Age=0; path=/";
    document.cookie = "refresh=; Max-Age=0; path=/";
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-black text-white">
        <Routes>
          {/* If logged in => MainMenu, else => SignUp */}
          <Route
            path="/"
            element={
              isLoggedIn
                ? <MainMenu onLogout={handleLogout}/>
                : <Navigate to="/sign-up" />
            }
          />

          {/* Sign-Up & Login */}
          <Route path="/sign-up"
            element={<SignupPage onSignup={handleSignup}/>}
          />
          <Route path="/sign-in"
            element={<LoginPage onLogin={handleLogin}/>}
          />

          {/* Protected */}
          <Route path="/shift-planner"
            element={isLoggedIn ? <ShiftPlanner/> : <Navigate to="/sign-up"/>}
          />
          <Route path="/employee-dashboard"
            element={isLoggedIn ? <EmployeeDashboard/> : <Navigate to="/sign-up"/>}
          />
          <Route path="/shift-swaps"
            element={isLoggedIn ? <ShiftSwapRequests/> : <Navigate to="/sign-up"/>}
          />

          {/* catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
