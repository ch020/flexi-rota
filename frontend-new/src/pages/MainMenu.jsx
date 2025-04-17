import React from "react";
import { useNavigate } from "react-router-dom";

const MainMenu = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-8">Main Menu</h1>

      <div className="flex flex-col space-y-4 w-full max-w-xs">
        <button
          onClick={() => navigate("/employee-dashboard")}
          className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition"
        >
          Employee Dashboard
        </button>

        <button
          onClick={() => navigate("/shift-planner")}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
        >
          Shift Planner
        </button>

        <button
          onClick={() => navigate("/shift-swaps")}  // Navigate to shift swap requests page
          className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-xl font-semibold transition"
        >
          Shift Swap Requests
        </button>

        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
