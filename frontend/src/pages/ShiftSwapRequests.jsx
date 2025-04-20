import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ShiftSwapRequests = () => {
  const [pendingSwaps, setPendingSwaps] = useState([]);
  const [newSwap, setNewSwap] = useState({ shift: '', reason: '' });

  const fetchPendingSwaps = async () => {
    try {
      const res = await api.get('/api/swaps/pending/');
      setPendingSwaps(res.data);
    } catch (error) {
      console.error('Failed to fetch swap requests:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/swaps/approve/${id}/`);
      fetchPendingSwaps();
    } catch (error) {
      console.error('Failed to approve swap:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/api/swaps/reject/${id}/`);
      fetchPendingSwaps();
    } catch (error) {
      console.error('Failed to reject swap:', error);
    }
  };

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
    fetchPendingSwaps();
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden p-6">
      <h1 className="text-3xl font-bold mb-6">Shift Swap Requests</h1>

      <div className="w-full max-w-lg">
        <h2 className="text-xl mb-4">Pending Requests</h2>
        {pendingSwaps.length === 0 ? (
          <p>No pending swap requests.</p>
        ) : (
          pendingSwaps.map((swap) => (
            <div key={swap.id} className="bg-gray-900 p-4 rounded mb-3 flex justify-between items-center">
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

      <div className="w-full max-w-lg mt-8">
        <h2 className="text-xl mb-4">Request a Swap</h2>
        <form onSubmit={handleNewSwapSubmit} className="bg-gray-900 p-4 rounded space-y-4">
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
  );
};

export default ShiftSwapRequests;