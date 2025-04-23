import React from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../assets/NotificationBell";

// add logo URL constant
const logoUrl =
  "https://i.ibb.co/whSvHbGj/Whats-App-Image-2025-03-20-at-13-00-26-4a5665d4-enhanced-removebg-preview.png";

const ManagerMenu = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-screen flex flex-col items-center justify-center bg-black text-white p-6 overflow-hidden">
      {/* Bell */}
      <div className="absolute top-4 right-6">
        <NotificationBell />
      </div>

      {/* Logo above the title */}
      <img
        src={logoUrl}
        alt="Flexi‑Rota Logo"
        className="h-16 w-auto mb-4"
      />

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
          Set Unavailability
        </button>

        <button
          onClick={() => navigate("/chat")}
          className="bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition"
        >
          Chat
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