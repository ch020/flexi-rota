// import React, { useState } from "react";
// import CircularSlider from "@fseehawer/react-circular-slider"; // Updated import

// const ShiftSelection = () => {
//   const [selectedDays, setSelectedDays] = useState([]);
//   const [shiftStart, setShiftStart] = useState(0);

//   const handleDayChange = (event) => {
//     const { value, checked } = event.target;
//     setSelectedDays((prev) =>
//       checked ? [...prev, value] : prev.filter((day) => day !== value)
//     );
//   };

//   const handleShiftStartChange = (value) => {
//     setShiftStart(value);
//   };

//   // Calculate shift end time, wrap around 24 if needed
//   const shiftEnd = (shiftStart + 8) % 24;

//   return (
//     <div className="shift-selection bg-gray-100 p-6 rounded-lg shadow-md max-w-lg mx-auto">
//       <h1 className="text-3xl font-semibold text-center mb-6">Select Your Available Days and Shift Start Time</h1>

//       <form>
//         {/* Days Selection */}
//         <div className="days-selection mb-6">
//           <h3 className="text-xl font-medium mb-4">Select Days</h3>
//           {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
//             <label key={day} className="block mb-2 text-lg">
//               <input
//                 type="checkbox"
//                 value={day}
//                 onChange={handleDayChange}
//                 checked={selectedDays.includes(day)}
//                 className="mr-2"
//               />
//               {day}
//             </label>
//           ))}
//         </div>

//         {/* Circular Slider for Shift Start */}
//         <div className="shift-time-selection mb-6 text-center">
//           <h3 className="text-xl font-medium mb-4">Select Shift Start Time</h3>
//           <CircularSlider
//             min={0}
//             max={24}
//             step={1}
//             value={shiftStart}
//             onChange={handleShiftStartChange}
//             trackColor="#D1D5DB"
//             fillColor="#3B82F6"
//             knobColor="#2563EB"
//             radius={120}
//             knobRadius={20}
//             fontSize={18}
//             progressBarWidth={8}
//             startAngle={-90}
//             endAngle={270}
//           />
//           <p className="text-lg mt-4">
//             Shift: {shiftStart}:00 - {shiftEnd}:00
//           </p>
//         </div>

//         {/* Submit Button */}
//         <button
//           type="submit"
//           className="w-full bg-blue-600 text-white py-2 rounded-lg text-lg hover:bg-blue-700 transition duration-300"
//         >
//           Submit
//         </button>
//       </form>

//       {/* Summary */}
//       <div className="summary mt-6">
//         <h3 className="text-xl font-medium">Your Selection</h3>
//         <p>Days: {selectedDays.join(", ") || "None selected"}</p>
//         <p>Shift: {shiftStart}:00 - {shiftEnd}:00</p>
//       </div>
//     </div>
//   );
// };

// export default ShiftSelection;
