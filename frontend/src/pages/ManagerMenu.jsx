import React from "react";
import { useNavigate } from "react-router-dom";

const ManagerMenu = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white p-6 overflow-hidden">
      <h1 className="text-4xl font-bold mb-8">Manager Menu</h1>
      <div className="flex flex-col space-y-6 w-full max-w-lg">
        <button
          onClick={() => navigate("/manager-recap")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition"
        >
          Manager Dashboard
        </button>
        <button
          onClick={() => navigate("/availability")}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
        >
          Set Availability
        </button>
        <button
          onClick={() => {
            onLogout();
            navigate("/sign-in", { replace: true });
          }}
          className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default ManagerMenu;