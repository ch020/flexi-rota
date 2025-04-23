import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ChatPage() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(null);
  const [isManager, setIsManager] = useState(false);
  const [users, setUsers]         = useState([]);
  const [roles, setRoles]         = useState([]);
  const rooms = ["Organisation","Team Leads","Event Planning"];
  const [activeRoom, setActiveRoom] = useState(rooms[0]);
  const [messages, setMessages]     = useState({});
  const [draft, setDraft]           = useState("");
  const [showAddChat, setShowAddChat] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [selUsers, setSelUsers]       = useState([]);
  const [selRoles, setSelRoles]       = useState([]);

  useEffect(() => {
    api.get("/api/users/me/", { withCredentials: true })
      .then(r => {
        setUser(r.data);
        setIsManager(r.data.role === "manager");
      })
      .catch(console.error);
    // preload users and roles for modal
    api.get("/api/users/", { withCredentials: true }).then(r => setUsers(r.data)).catch(console.error);
    api.get("/api/roles/", { withCredentials: true }).then(r => setRoles(r.data)).catch(console.error);
  }, []);

  const fetchMessages = async room => {
    try {
      const res = await api.get(`/api/chat/${room}/messages/`, { withCredentials: true });
      setMessages(prev => ({ ...prev, [room]: res.data }));
    } catch (e) {
      console.error("load messages:", e);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchMessages(activeRoom);
    const iv = setInterval(() => fetchMessages(activeRoom), 5000);
    return () => clearInterval(iv);
  }, [user, activeRoom]);

  const sendMessage = async () => {
    if (!draft.trim()) return;
    try {
      const res = await api.post(
        `/api/chat/${activeRoom}/messages/`,
        { text: draft.trim() },
        { withCredentials: true }
      );
      setMessages(prev => ({
        ...prev,
        [activeRoom]: [...(prev[activeRoom]||[]), res.data]
      }));
      setDraft("");
    } catch (e) {
      console.error("send msg:", e);
    }
  };

  // non‑functional “Add Chat” modal
  const AddChatModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg p-6 w-96">
        <h3 className="text-xl font-bold mb-4">New Chat</h3>
        <label className="block mb-2">Chat Name</label>
        <input
          value={newChatName}
          onChange={e => setNewChatName(e.target.value)}
          className="w-full mb-4 p-2 bg-gray-800 rounded"
          placeholder="Enter chat name"
        />
        <label className="block mb-2">Select Roles</label>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {roles.map(r => (
            <label key={r.id} className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
              <input
                type="checkbox"
                value={r.id}
                checked={selRoles.includes(r.id)}
                onChange={() => {
                  setSelRoles(prev =>
                    prev.includes(r.id)
                      ? prev.filter(x => x !== r.id)
                      : [...prev, r.id]
                  );
                }}
                className="h-4 w-4 text-blue-500"
              />
              <span>{r.name}</span>
            </label>
          ))}
        </div>
        <label className="block mb-2">Select Users</label>
        <select
          multiple
          value={selUsers}
          onChange={e =>
            setSelUsers(Array.from(e.target.selectedOptions, o => o.value))
          }
          className="w-full mb-4 p-2 bg-gray-800 rounded"
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.full_name||u.username}</option>
          ))}
        </select>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setShowAddChat(false)}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // demo: just close
              setShowAddChat(false);
            }}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading chat…
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <aside className="w-1/4 bg-gray-900 border-r border-gray-700 p-6 flex flex-col">
        <h2 className="text-lg font-bold mb-4 text-white">Chats</h2>
        <ul className="flex-1 overflow-auto space-y-2">
          {rooms.map(room => (
            <li key={room}>
              <button
                onClick={() => setActiveRoom(room)}
                className={`w-full text-left px-4 py-2 rounded-md transition ${
                  activeRoom === room
                    ? "bg-gray-700 font-semibold"
                    : "hover:bg-gray-800"
                }`}
              >
                {room}
              </button>
            </li>
          ))}
        </ul>
        {isManager && (
          <button
            onClick={() => setShowAddChat(true)}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold transition"
          >
            + Add Chat
          </button>
        )}
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-gray-400 hover:text-white transition"
        >
          ← Back
        </button>
      </aside>
      <main className="flex-1 p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">{activeRoom}</h2>
        <div className="flex-1 overflow-auto space-y-3 mb-4">
          {messages[activeRoom]?.map((m, i) => (
            <div
              key={i}
              className={`max-w-md px-4 py-2 rounded-lg ${
                m.from === "You"
                  ? "bg-blue-600 text-white self-end"
                  : "bg-gray-800 text-white"
              }`}
            >
              <span className="font-semibold">{m.from}:</span> {m.text}
            </div>
          ))}
        </div>
        <div className="flex items-center">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="ml-3 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md font-semibold transition"
          >
            Send
          </button>
        </div>
      </main>

      {showAddChat && <AddChatModal />}
    </div>
  );
}