import React, { useEffect, useState } from 'react';
import api from '../services/api';
import BackButton from '../assets/BackButton'; // Import the BackButton component

const EmployeeDashboard = () => {
  const [payData, setPayData] = useState({ current_month: 0, previous_month: 0 });
  const [shifts, setShifts] = useState([]);
  const [error, setError] = useState(null);
  const [pendingSwaps, setPendingSwaps] = useState([]);
  const [newSwap, setNewSwap] = useState({ shift: '', reason: '' });

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
      setShifts(res.data); // Assuming the response data contains the shifts for the employee
    } catch (error) {
      console.error('Failed to fetch shift data:', error);
      setError('Failed to load shifts');
    }
  };

  // Fetch Pending Swap Requests
  const fetchPendingSwaps = async () => {
    try {
      const res = await api.get('/api/swaps/pending/');
      setPendingSwaps(res.data);
    } catch (error) {
      console.error('Failed to fetch swap requests:', error);
    }
  };

  // Approve a Swap Request
  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/swaps/approve/${id}/`);
      fetchPendingSwaps();
    } catch (error) {
      console.error('Failed to approve swap:', error);
    }
  };

  // Reject a Swap Request
  const handleReject = async (id) => {
    try {
      await api.patch(`/api/swaps/reject/${id}/`);
      fetchPendingSwaps();
    } catch (error) {
      console.error('Failed to reject swap:', error);
    }
  };

  // Submit a New Swap Request
  const handleNewSwapSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/swaps/request/', newSwap);
      setNewSwap({ shift: '', reason: '' });
      fetchPendingSwaps();
    } catch (error) {
      console.error('Failed to submit swap request:', error);
    }
  };

  useEffect(() => {
    fetchPayData();
    fetchShifts();
    fetchPendingSwaps();
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
      const dayShifts = shifts.filter(
        (shift) =>
          new Date(shift.date).toLocaleDateString() === currentDate.toLocaleDateString()
      );

      return (
        <div key={index} className="flex flex-col items-center p-4">
          <span className="font-semibold text-lg">{formattedDate}</span>
          {dayShifts.length > 0 ? (
            <ul className="mt-2 text-sm">
              {dayShifts.map((shift) => (
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
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden">
      <BackButton /> {/* Add the BackButton component */}
      <h1 className="text-3xl font-bold mb-8">Employee Dashboard</h1>

      {/* Pay Summary */}
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-sm text-center mb-8">
        <h2 className="text-xl font-semibold mb-4">Pay Summary</h2>
        <p className="text-lg">
          💷 <strong>Current Month:</strong> £{payData.current_month}
        </p>
        <p className="text-lg mt-2">
          📊 <strong>Previous Month:</strong> £{payData.previous_month}
        </p>
      </div>

      {/* Shifts for the Week */}
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-sm text-center mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Shifts for the Week</h2>
        {error ? <p className="text-red-500">{error}</p> : renderCalendar()}
      </div>

      {/* Shift Swap Requests */}
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-lg text-center">
        <h2 className="text-xl font-semibold mb-4">Shift Swap Requests</h2>
        <div>
          {pendingSwaps.length === 0 ? (
            <p>No pending swap requests.</p>
          ) : (
            pendingSwaps.map((swap) => (
              <div key={swap.id} className="bg-gray-800 p-4 rounded mb-3 flex justify-between items-center">
                <div>
                  <p><strong>Shift ID:</strong> {swap.shift}</p>
                  <p><strong>Reason:</strong> {swap.reason}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleApprove(swap.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(swap.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Request a Swap */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Request a Swap</h3>
          <form onSubmit={handleNewSwapSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Shift ID</label>
              <input
                type="text"
                value={newSwap.shift}
                onChange={(e) => setNewSwap({ ...newSwap, shift: e.target.value })}
                className="w-full p-2 rounded bg-gray-800 text-white"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Reason</label>
              <textarea
                value={newSwap.reason}
                onChange={(e) => setNewSwap({ ...newSwap, reason: e.target.value })}
                className="w-full p-2 rounded bg-gray-800 text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;