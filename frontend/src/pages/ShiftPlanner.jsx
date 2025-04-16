import React, { useState } from "react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const ShiftPlanner = () => {
  const [shifts, setShifts] = useState({});

  const handleCellClick = (day, hour) => {
    setShifts((prev) => ({
      ...prev,
      [day]: parseInt(hour), // store start hour
    }));
  };

  const isShiftSelected = (day, hour) => {
    const start = shifts[day];
    if (start === undefined) return false;
    const end = (start + 8) % 24;
    if (start < end) {
      return hour >= start && hour < end;
    } else {
      // handle wrapping past midnight
      return hour >= start || hour < end;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-center">Shift Planner</h1>

      <div className="grid grid-cols-6 border border-gray-300">
        <div className="bg-gray-200 font-medium p-2 text-center">Time</div>
        {days.map((day) => (
          <div key={day} className="bg-gray-200 font-medium p-2 text-center">{day}</div>
        ))}

        {hours.map((time, i) => (
          <React.Fragment key={time}>
            <div className="border border-gray-300 p-2 text-sm text-center">{time}</div>
            {days.map((day) => (
              <div
                key={day}
                onClick={() => handleCellClick(day, i)}
                className={`border border-gray-300 cursor-pointer p-2 text-center ${
                  isShiftSelected(day, i)
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-100"
                }`}
              >
                {isShiftSelected(day, i) ? "🕒" : ""}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6">
        <h2 className="text-xl font-medium mb-2">Your Shift Selection</h2>
        {days.map((day) => (
          <p key={day}>
            {day}:{" "}
            {shifts[day] !== undefined
              ? `${shifts[day]}:00 - ${(shifts[day] + 8) % 24}:00`
              : "No shift selected"}
          </p>
        ))}
      </div>
    </div>
  );
};

export default ShiftPlanner;
