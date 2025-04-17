import React, { useEffect, useState } from 'react';
import api from '../services/api';

const EmployeeDashboard = () => {
  const [payData, setPayData] = useState({ current_month: 0, previous_month: 0 });
  const [shifts, setShifts] = useState([]);
  const [error, setError] = useState(null);

  // Fetch Pay Data
  const fetchPayData = async () => {
    try {
      const res = await api.get('/api/pay-estimate/');
      setPayData(res.data);
    } catch (error) {
      console.error('Failed to fetch pay data:', error);
    }
  };

  // Fetch Shift Data for the week
  const fetchShifts = async () => {
    try {
      const res = await api.get('/api/availability/');
      setShifts(res.data);  // Assuming the response data contains the shifts for the employee
    } catch (error) {
      console.error('Failed to fetch shift data:', error);
      setError('Failed to load shifts');
    }
  };

  useEffect(() => {
    fetchPayData();
    fetchShifts();
  }, []);

  // Helper function to format the date (assuming you want to show the week starting from Monday)
  const getWeekStartDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Get the day of the week (0 - Sunday, 1 - Monday, etc.)
    const difference = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust if Sunday
    const startDate = new Date(today.setDate(difference));
    return startDate;
  };

  // Helper function to get a specific day's date in the week
  const getDayOfWeek = (startDate, dayOffset) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOffset);
    return date;
  };

  // Render the calendar days with shifts
  const renderCalendar = () => {
    const startDate = getWeekStartDate(); // Get the start of the week (Monday)
    const daysOfWeek = [...Array(7)].map((_, index) => {
      const currentDate = getDayOfWeek(startDate, index);
      const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}`;

      // Filter shifts for this specific day
      const dayShifts = shifts.filter(shift =>
        new Date(shift.date).toLocaleDateString() === currentDate.toLocaleDateString()
      );

      return (
        <div key={index} className="flex flex-col items-center p-4">
          <span className="font-semibold text-lg">{formattedDate}</span>
          {dayShifts.length > 0 ? (
            <ul className="mt-2 text-sm">
              {dayShifts.map(shift => (
                <li key={shift.id} className="text-gray-300">
                  {shift.start_time} - {shift.end_time}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-500">No shifts</span>
          )}
        </div>
      );
    });

    return <div className="grid grid-cols-7 gap-4">{daysOfWeek}</div>;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-8">Employee Dashboard</h1>
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-sm text-center mb-8">
        <h2 className="text-xl font-semibold mb-4">Pay Summary</h2>
        <p className="text-lg">💷 <strong>Current Month:</strong> £{payData.current_month}</p>
        <p className="text-lg mt-2">📊 <strong>Previous Month:</strong> £{payData.previous_month}</p>
      </div>

      <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-sm text-center">
        <h2 className="text-xl font-semibold mb-4">Your Shifts for the Week</h2>
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          renderCalendar()
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
