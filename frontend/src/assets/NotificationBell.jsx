import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function NotificationBell() {
  const [unread, setUnread]   = useState(0);
  const [open, setOpen]       = useState(false);
  const [notes, setNotes]     = useState([]);

  useEffect(() => {
    api.get("/api/notifications/", { withCredentials: true })
      .then(r => setUnread(r.data.length))
      .catch(console.error);
  }, []);

  const toggle = () => {
    if (!open) {
      api.get("/api/notifications/", { withCredentials: true })
         .then(r => { setNotes(r.data); setOpen(true); })
         .catch(console.error);
    } else setOpen(false);
  };

  const markRead = async id => {
    await api.post(`/api/notifications/${id}/read/`, {}, { withCredentials: true });
    setNotes(ns => ns.filter(n => n.id !== id));
    setUnread(u => u - 1);
  };

  return (
    <div className="relative">
      <button onClick={toggle} className="text-2xl">
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-600 text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 text-white rounded shadow-lg z-50">
          <div className="p-2 border-b border-gray-700 flex justify-between">
            <span>Notifications</span>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>
          {notes.length === 0
            ? <div className="p-4 text-gray-400">No unread</div>
            : notes.map(n => (
                <div key={n.id} className="p-3 border-b border-gray-700">
                  <p className="text-sm">{n.message}</p>
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-xs text-blue-400 hover:underline mt-1"
                  >Mark read</button>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}