import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../index.css";            // your global overrides
import "../assets/Calendar.css";  // custom-calendar styles to match MainMenu
import api from "../services/api";
import BackButton from "../assets/BackButton";  // ← import same component

export default function AvailabilityPage() {
  const [slots, setSlots]           = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime]   = useState("09:00");
  const [endTime, setEndTime]       = useState("17:00");

  // 1) load existing availability
  useEffect(() => {
    api.get("/api/availability/")
       .then(res => setSlots(res.data))
       .catch(console.error);
  }, []);

  // 2) highlight dates that already have slots
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const day = date.toISOString().split("T")[0];
      return slots.some(s => s.start_time.startsWith(day))
        ? "bg-green-600 text-white rounded"
        : null;
    }
    return null;
  };

  // 3) when user clicks a day: open time form
  const handleDayClick = date => {
    setSelectedDate(date);
    setStartTime("09:00");
    setEndTime("17:00");
  };

  // 4) submit the time slot for that date
  const handleSubmit = async e => {
    e.preventDefault();
    if (endTime <= startTime) {
      return alert("End must be after start");
    }
    // build a local YYYY‑MM‑DD string to avoid UTC offset issues
    const year  = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day   = String(selectedDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const startISO = new Date(`${dateStr}T${startTime}`).toISOString();
    const endISO   = new Date(`${dateStr}T${endTime}`).toISOString();

    try {
      await api.post("/api/availability/", {
        start_time: startISO,
        end_time:   endISO,
      });
      // refresh
      const res = await api.get("/api/availability/");
      setSlots(res.data);
      setSelectedDate(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to save");
    }
  };

  // 5) remove an existing slot
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/availability/${id}/`);
      setSlots(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.response?.data?.detail || "Failed to remove slot");
    }
  };

  return (
    <div className="relative h-screen w-screen flex flex-col items-center justify-start bg-black text-white p-6">
      <BackButton />  {/* ← same back button as in EmployeeDashboard */}
      <h1 className="text-3xl font-bold mb-4">Set Your Availability</h1>
      <Calendar
        onClickDay={handleDayClick}
        tileClassName={tileClassName}
        className="custom-calendar border border-gray-700 rounded-xl mb-6"
      />

      {selectedDate && (
        <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Availability for {selectedDate.toLocaleDateString()}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full p-2 bg-black border border-gray-700 rounded text-white"
                required
              />
            </div>
            <div>
              <label className="block mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full p-2 bg-black border border-gray-700 rounded text-white"
                required
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <ul className="w-full max-w-md space-y-2">
        {slots.map(slot => (
          <li
            key={slot.id}
            className="bg-gray-800 p-3 rounded flex justify-between items-center"
          >
            <div>
              {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {" – "}
              {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {" on "}
              {new Date(slot.start_time).toLocaleDateString()}
            </div>
            <button
              onClick={() => handleDelete(slot.id)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}