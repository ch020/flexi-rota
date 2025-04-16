import React, { useState } from "react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const ShiftPlanner = () => {
  const [shifts, setShifts] = useState({});

  const handleCellClick = (day, hour) => {
    setShifts((prev) => ({
      ...prev,
      [day]: parseInt(hour),
    }));
  };

  const isShiftSelected = (day, hour) => {
    const start = shifts[day];
    if (start === undefined) return false;
    const end = (start + 8) % 24;
    if (start < end) {
      return hour >= start && hour < end;
    } else {
      return hour >= start || hour < end;
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6 text-white text-center">
        Choose Your Shifts
      </h1>

      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-[100px_repeat(24,1fr)] border border-white/30 w-[95%] md:w-[80%] lg:w-[70%] mx-auto">
          <div className="bg-black text-white font-medium p-2 text-center border border-white/30">
            Day / Time
          </div>
          {hours.map((time) => (
            <div
              key={time}
              className="bg-black text-white font-medium p-2 text-center border border-white/30"
            >
              {time}
            </div>
          ))}

          {days.map((day) => (
            <React.Fragment key={day}>
              <div className="bg-black text-white font-medium p-2 text-center border border-white/30">
                {day}
              </div>
              {hours.map((_, i) => (
                <div
                  key={day + i}
                  onClick={() => handleCellClick(day, i)}
                  className={`border border-white/30 cursor-pointer p-2 text-center bg-black transition duration-200 ${
                    isShiftSelected(day, i)
                      ? "bg-green-500"
                      : "hover:bg-white/10"
                  }`}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 w-[95%] md:w-[80%] lg:w-[70%] text-white text-center">
        <h2 className="text-xl font-semibold mb-2">Your Shift Selection</h2>
        {days.map((day) => (
          <p key={day} className="text-base">
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
