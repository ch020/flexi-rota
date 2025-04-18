import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../assets/Calendar.css"; // Import the custom calendar styles
import api from "../services/api";

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
  const handleLogout = () => {
    // Clear any authentication tokens or session data
    localStorage.removeItem("authToken"); // Assuming the token is stored in localStorage
    sessionStorage.clear(); // Clear session storage if used

    // Redirect to the sign-in page
    navigate("/sign-in");
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden p-6">
      <h1 className="text-4xl font-bold mb-8">Flexi-rota</h1>

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
            onClick={() => navigate("/shift-planner")}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
          >
            Shift Planner
          </button>

          {/* <button
            onClick={() => navigate("/shift-swaps")}
            className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-xl font-semibold transition"
          >
            Shift Swap Requests
          </button> */}

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