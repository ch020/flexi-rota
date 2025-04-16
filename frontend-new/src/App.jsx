import React, { useState } from "react";
import LoginPage from "./pages/LoginPage";
import ShiftPlanner from "./pages/ShiftPlanner";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true); // Set login status to true
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {isLoggedIn ? (
        <ShiftPlanner /> // Show Shift Planner if logged in
      ) : (
        <LoginPage onLogin={handleLogin} /> // Show login page if not logged in
      )}
    </div>
  );
}

export default App;
