import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../assets/Calendar.css"; // Import the custom calendar styles
import api from "../services/api";
import NotificationBell from "../assets/NotificationBell";

const MainMenu = ({ onLogout }) => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch shifts for the user
  const fetchShifts = async () => {
    try {
      const res = await api.get("/api/availability/"); // Fetch shifts for the logged-in user
      setShifts(res.data);
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  // Highlight dates with shifts
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const formattedDate = date.toISOString().split("T")[0];
      if (shifts.some((shift) => shift.date === formattedDate)) {
        return "highlighted-date"; // Custom class for highlighted dates
      }
    }
    return null;
  };

  // Disable clicking on days
  const handleDayClick = () => {
    // Prevent any action when a day is clicked
    return;
  };

  // Handle logout
  const handleLogout = async () => {
    // grab the refresh token cookie
    const refresh = document.cookie
      .split("; ")
      .find(c => c.startsWith("refresh="))
      ?.split("=")[1];
    try {
      if (refresh) {
        // call your logout endpoint to blacklist the refresh token
        await api.post("/api/logout/", { refresh });
      }
    } catch (err) {
      console.warn("Logout API error:", err.response?.data || err);
    } finally {
      // wipe out JWT cookies client‑side
      document.cookie = "access=; Max-Age=0; path=/";
      document.cookie = "refresh=; Max-Age=0; path=/";
      // go to login
      navigate("/sign-in");
    }
  };

  return (
    <div className="relative h-screen w-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden p-6">
      {/* Bell in top‑right */}
      <div className="absolute top-4 right-6">
        <NotificationBell />
      </div>

      <img
        src="https://i.ibb.co/whSvHbGj/Whats-App-Image-2025-03-20-at-13-00-26-4a5665d4-enhanced-removebg-preview.png"
        alt="Flexi‑Rota Logo"
        className="h-16 w-auto mb-8"
      />

      <div className="flex flex-col items-center w-full max-w-lg space-y-6">
        <Calendar
          onChange={setSelectedDate} // This can be removed if you don't want to allow date selection
          value={selectedDate}
          tileClassName={tileClassName}
          onClickDay={handleDayClick} // Disable clicking on days
          className="custom-calendar" // Custom class for the calendar
        />

        <div className="flex flex-col space-y-4 w-full">
          <button
            onClick={() => navigate("/employee-dashboard")}
            className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition"
          >
            Employee Dashboard
          </button>

          <button
            onClick={() => navigate("/availability")}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
          >
            Set Availability
          </button>

          <button
            onClick={() => navigate("/chat")}
            className="bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition"
          >
            Chat
          </button>

          <button
            onClick={handleLogout} // Call the logout handler
            className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;