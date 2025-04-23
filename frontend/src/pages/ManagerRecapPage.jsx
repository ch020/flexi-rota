import React, { useEffect, useState } from "react";
import { useNavigate }                  from "react-router-dom";
import Calendar                         from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../assets/Calendar.css";
import api                              from "../services/api";
import BackButton                       from "../assets/BackButton";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// 1) Hook to fetch users + availability
const useEmployeeAvailability = () => {
  const [availabilityData, setAvailabilityData] = useState([]);
  const [rawSlots, setRawSlots]                 = useState([]);
  const [loading, setLoading]                   = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [uRes, aRes] = await Promise.all([
          api.get("/api/users/",         { withCredentials: true }),
          api.get("/api/availability/",  { withCredentials: true })
        ]);
        const users = uRes.data;   // [{id, username, first_name, last_name, role},…]
        const slots = aRes.data;   // [{id, user, start_time, end_time},…]

        const now = new Date();
        const future = slots.filter(s => new Date(s.end_time) >= now);
        setRawSlots(future);

        // build a per‑user map
        const map = {};
        users.forEach(u => {
          map[u.id] = {
            id: u.id,
            name: `${u.first_name} ${u.last_name}`.trim() || u.username,
            availability: [],
            weeklyAvailability: {
              Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
            }
          };
        });

        future.forEach(s => {
          const dt = new Date(s.start_time);
          const day = dt.toLocaleDateString("en-GB", { weekday: "long" });
          const t   = dt.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
          if (map[s.user]) {
            map[s.user].availability.push(t);
            if (map[s.user].weeklyAvailability[day])
              map[s.user].weeklyAvailability[day].push(t);
          }
        });

        setAvailabilityData(Object.values(map));
      } catch (err) {
        console.error("Error loading availability/users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return { availabilityData, rawSlots, loading };
};

// 3) By Day View logic lives in ManagerRecapPage below
// 4) Manage Roles View
const ManageRolesView = () => {
  const [roles, setRoles]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [newRoleName, setNewRoleName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [rRes, uRes] = await Promise.all([
          api.get("/api/roles/", { withCredentials: true }),
          api.get("/api/users/", { withCredentials: true })
        ]);
        setRoles(rRes.data);
        setUsers(uRes.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const createRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const res = await api.post("/api/roles/", { name: newRoleName }, { withCredentials: true });
      setRoles(rs => [...rs, res.data]);
      setNewRoleName("");
    } catch (e) { console.error(e); alert("Could not create role"); }
  };

  const assignRole = async (userId, roleId) => {
    try {
      const res = await api.patch(
        `/api/users/${userId}/`,
        { role_title: roleId || null },
        { withCredentials: true }
      );
      setUsers(us => us.map(u => u.id===res.data.id ? res.data : u));
    } catch (e) { console.error(e); alert("Could not assign role"); }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Manage Roles</h2>
      <div className="flex mb-6">
        <input
          className="flex-1 px-3 py-2 rounded-l bg-gray-800 text-white border border-gray-700"
          placeholder="New role name"
          value={newRoleName}
          onChange={e => setNewRoleName(e.target.value)}
        />
        <button
          onClick={createRole}
          className="px-4 py-2 bg-green-600 text-white rounded-r hover:bg-green-500"
        >Create</button>
      </div>
      <div className="space-y-3">
        {users.map(u => {
          // look up the assigned role’s name (u.role_title is the role ID)
          const roleName = roles.find(r => r.id === u.role_title)?.name;

          return (
            <div key={u.id} className="flex items-center justify-between bg-gray-800 p-4 rounded">
              <span className="text-white">
                {u.full_name || u.username}
                {roleName ? ` (${roleName})` : ""}    {/* ← append role */}
              </span>
              <select
                className="bg-gray-700 text-white px-2 py-1 rounded"
                value={u.role_title || ""}
                onChange={e => assignRole(u.id, parseInt(e.target.value, 10))}
              >
                <option value="">— No Role —</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 5) Invite View (Employee vs Manager)
const InviteView = () => {
  const [employeeUrl, setEmployeeUrl] = useState("");
  const [managerUrl, setManagerUrl]   = useState("");

  const generateInvite = async (role, setter) => {
    try {
      const { data } = await api.post(
        "/api/generate-invite/",
        { role },
        { withCredentials: true }
      );
      setter(data.invite_url);
    } catch (err) {
      console.error("Invite error:", err.response?.data || err);
      alert(err.response?.data?.detail || "Could not generate invite");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">Get Invite Links</h2>

      <div className="flex space-x-2">
        <button
          onClick={() => generateInvite("employee", setEmployeeUrl)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
        >
          Employee Invite
        </button>
        <button
          onClick={() => generateInvite("manager", setManagerUrl)}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500"
        >
          Manager Invite
        </button>
      </div>

      {employeeUrl && (
        <div className="break-all text-blue-400">
          <strong>Employee link:</strong>{" "}
          <a href={employeeUrl}>{employeeUrl}</a>
        </div>
      )}
      {managerUrl && (
        <div className="break-all text-blue-400">
          <strong>Manager link:</strong>{" "}
          <a href={managerUrl}>{managerUrl}</a>
        </div>
      )}
    </div>
  );
};

const FairnessAnalyticsView = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/api/analytics/fairness/");
        setAnalytics(res.data);
      } catch (err) {
        console.error("Failed to load fairness analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <p className="text-white">Loading analytics...</p>;

  if (!analytics) return <p className="text-red-400">Failed to load data.</p>;

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow text-white">
      <h2 className="text-2xl font-semibold mb-4">Fairness Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 p-4 rounded">
          <p className="text-gray-400">Total Employees</p>
          <p className="text-3xl">{analytics.total_employees}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <p className="text-gray-400">Average Shifts</p>
          <p className="text-3xl">{analytics.average_shifts}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <p className="text-gray-400">Fairness Score</p>
          <p className="text-3xl">{analytics.fairness_score}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-700">
          <thead>
            <tr className="bg-gray-800 text-gray-300">
              <th className="p-2 border border-gray-700">Employee</th>
              <th className="p-2 border border-gray-700">Shifts</th>
              <th className="p-2 border border-gray-700">Weekly Hours</th>
            </tr>
          </thead>
          <tbody>
            {analytics.shift_distribution.map((emp, idx) => (
              <tr key={idx} className="hover:bg-gray-800">
                <td className="p-2 border border-gray-700">{emp.employee.full_name || emp.employee.username}</td>
                <td className="p-2 border border-gray-700">{emp.shifts}</td>
                <td className="p-2 border border-gray-700">
                  {Object.entries(emp.weekly_hours).map(([week, hours]) => (
                    <div key={week}>{week}: {hours.toFixed(2)}h</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// 6) Create & Assign Shifts View
const AssignShiftsView = () => {
  const [start, setStart]            = useState("");
  const [end, setEnd]                = useState("");
  const [roles, setRoles]            = useState([]);
  const [reqs, setReqs]              = useState([{ role: "", count: 1 }]);
  const [templates, setTmpls]        = useState([]);
  const [users, setUsers]            = useState([]);
  const [createMsg, setCreateMsg]    = useState("");
  const [assignMsg, setAssignMsg]    = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState({});

  // fetch unassigned templates & employee list
  const refreshData = () => {
    api.get("/api/shift-templates/").then(r => setTmpls(r.data));
    api.get("/api/users/").then(r => setUsers(r.data));
  };
  useEffect(refreshData, [createMsg, assignMsg]);

  // fetch roles for requirement picks
  useEffect(() => {
    api.get("/api/roles/").then(r => setRoles(r.data));
  }, []);

  const handleAddReq = () => {
    setReqs(rs => [...rs, { role: "", count: 1 }]);
  };
  const handleReqChange = (i, field, val) => {
    setReqs(rs => {
      const copy = [...rs];
      copy[i][field] = val;
      return copy;
    });
  };
  const handleRemoveReq = i => {
    setReqs(rs => rs.filter((_, idx) => idx !== i));
  };

  // create template + role‐requirements
  const handleCreate = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post("/api/shift-templates/", {
        start_time: new Date(start).toISOString(),
        end_time:   new Date(end).toISOString(),
      });
      const tmplId = data.id;

      // POST your requirements
      await api.post(
        `/api/shift-templates/${tmplId}/set-roles/`,
        { roles: reqs.filter(r => r.role).map(r => ({ role: r.role, count: r.count })) }
      );

      setCreateMsg("Template + requirements created.");
      setStart(""); setEnd(""); setReqs([{role:"",count:1}]);
    } catch (err) {
      setCreateMsg(err.response?.data?.detail || "Create failed");
    }
  };

  // auto‑assign all
  const handleAutoAssign = async () => {
    try {
      const { data } = await api.post("/api/auto-assign-shifts/");
      setAssignMsg(data.detail);
    } catch (err) {
      setAssignMsg(err.response?.data?.detail || "Auto‑assign failed");
    }
  };

  // when you choose an employee from the dropdown
  const handleSelectionChange = (tmplId, userId) => {
    setSelectedAssignee(prev => ({ ...prev, [tmplId]: userId }));
  };

  // manual assign one template to one user
  const handleManualAssign = async (tmplId, userId) => {
    try {
      await api.post(
        `/api/shift-templates/${tmplId}/assign/`,
        { user_id: userId },
        { withCredentials: true }
      );
      refreshData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Assignment failed");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Create Shift Template</h2>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-white">Start</label>
          <input
            type="datetime-local"
            value={start}
            onChange={e => setStart(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded"
            required
          />
        </div>
        <div>
          <label className="block text-white">End</label>
          <input
            type="datetime-local"
            value={end}
            onChange={e => setEnd(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded"
            required
          />
        </div>

        <div>
          <label className="block text-white mb-2">Role Requirements</label>
          {reqs.map((r, i) => (
            <div key={i} className="flex space-x-2 items-center mb-2">
              <select
                value={r.role}
                onChange={e => handleReqChange(i, "role", parseInt(e.target.value,10))}
                className="flex-1 p-2 bg-gray-700 text-white rounded"
                required
              >
                <option value="">Select role…</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={r.count}
                onChange={e => handleReqChange(i, "count", parseInt(e.target.value,10))}
                className="w-20 p-2 bg-gray-700 text-white rounded text-center"
                required
              />
              <button
                type="button"
                onClick={() => handleRemoveReq(i)}
                className="text-red-500 hover:text-red-400"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddReq}
            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded"
          >
            + Add Role
          </button>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded"
        >
          Create Shift
        </button>
        {createMsg && <p className="text-white">{createMsg}</p>}
      </form>

      {/* Manual Assignment */}
      <div className="pt-6 border-t border-gray-700">
        <h2 className="text-2xl font-semibold text-white">Manual Assignment</h2>
        <ul className="space-y-4">
          {templates.map(t => (
            <li key={t.id} className="bg-gray-800 p-4 rounded">
              <div className="text-white mb-2">
                {new Date(t.start_time).toLocaleString()} –{" "}
                {new Date(t.end_time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
              </div>
              <div className="flex space-x-2 items-center">
                <select
                  value={selectedAssignee[t.id] || ""}
                  onChange={e =>
                    handleSelectionChange(t.id, parseInt(e.target.value, 10))
                  }
                  className="flex-1 p-2 bg-gray-700 text-white rounded"
                >
                  <option value="">Select employee…</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.username}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    handleManualAssign(t.id, selectedAssignee[t.id])
                  }
                  disabled={!selectedAssignee[t.id]}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </li>
          ))}
          {templates.length === 0 && (
            <p className="text-gray-400">No unassigned templates.</p>
          )}
        </ul>
      </div>

      {/* Auto‑Assign Shifts */}
      <div className="pt-6 border-t border-gray-700">
        <h2 className="text-2xl font-semibold text-white">Auto‑Assign Shifts</h2>
        <button
          onClick={handleAutoAssign}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Assign All Pending
        </button>
        {assignMsg && <p className="text-white mt-2">{assignMsg}</p>}
      </div>
    </div>
  );
};

// –––––– Notification Popup ––––––
const NotificationsPopup = ({ onClose }) => {
  const [notes, setNotes]     = useState([]);

  useEffect(() => {
    api.get("/api/notifications/", { withCredentials: true })
      .then(r => setNotes(r.data))
      .catch(console.error);
  }, []);

  const markRead = async id => {
    try {
      await api.post(`/api/notifications/${id}/read/`, {}, { withCredentials: true });
      setNotes(ns => ns.filter(n => n.id !== id));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-gray-800 text-white rounded shadow-lg z-50">
      <div className="p-2 border-b border-gray-700 flex justify-between">
        <span>Notifications</span>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
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
          ))
      }
    </div>
  );
};

// –––––– Manager “Send Notification” Tab ––––––
const NotificationsView = () => {
  const [roles, setRoles]     = useState([]);
  const [selRole, setSelRole] = useState("");
  const [msg, setMsg]         = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    api.get("/api/roles/", { withCredentials: true })
      .then(r => setRoles(r.data))
      .catch(console.error);
  }, []);

  const send = async () => {
    if (!selRole || !msg.trim())
      return alert("Select a role and enter a message");

    try {
      // build the exact payload your DRF serializer expects:
      const payload = {
        roles:      [parseInt(selRole, 10)],
        recipients: [],          // empty because you’re targeting by role
        message:    msg
      };

      const response = await api.post(
        "/api/notifications/send/",
        payload,
        { withCredentials: true }
      );
      console.log("Notification send response:", response);
      setFeedback("Sent!");
      setMsg("");
      setSelRole("");
    } catch (err) {
      // log full response so you see status + body
      console.error("Notification send failed:", err.response);
      const body = err.response?.data;
      setFeedback(
        body?.detail 
          || JSON.stringify(body) 
          || err.message
      );
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">Send Notification</h2>
      <select
        value={selRole}
        onChange={e => setSelRole(e.target.value)}
        className="w-full p-2 bg-gray-700 text-white rounded"
      >
        <option value="">Select role…</option>
        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      <textarea
        rows={3}
        value={msg}
        onChange={e => setMsg(e.target.value)}
        className="w-full p-2 bg-gray-700 text-white rounded"
        placeholder="Your message…"
      />
      <button
        onClick={send}
        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded"
      >Send</button>
      {feedback && <p className="text-white">{feedback}</p>}
    </div>
  );
};

export default function ManagerRecapPage() {
  const navigate = useNavigate();
  const { availabilityData, rawSlots, loading } = useEmployeeAvailability();
  const [view, setView]           = useState("day");
  const [selectedDate, setSelectedDate] = useState(null);
  // notifications badge & popup
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    api.get("/api/notifications/", { withCredentials: true })
       .then(r => setUnread(r.data.length))
       .catch(console.error);
  }, []);

  // handler passed to the Calendar
  const onDayClick = (date) => {
    // build a local YYYY‑MM‑DD string (no TZ shift)
    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day   = String(date.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // … inside ManagerRecapPage(), right after onDayClick …
  
  const availabilityByDate = availabilityData.map(emp => {
    // grab only this employee’s raw slots on selectedDate
    const slotsForDate = rawSlots.filter(s => {
      // quick guard
      if (!selectedDate || s.user !== emp.id) return false;
      // compare the first 10 chars of the ISO string (YYYY-MM-DD)
      const slotDay = new Date(s.start_time).toISOString().slice(0,10);
      return slotDay === selectedDate;
    });


    return { id: emp.id, name: emp.name, slots: slotsForDate };
  });

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen flex flex-col items-center bg-black text-white p-6 overflow-auto">
      <div className="w-full max-w-3xl">
        {/* Bell button */}
        <div className="absolute top-4 right-6">
          <button
            onClick={() => setShowNotif(v => !v)}
            className="relative text-2xl"
          >
            🔔
            {unread > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-600 text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
          {showNotif && <NotificationsPopup onClose={() => setShowNotif(false)} />}
        </div>
        <div 
          onClick={() => navigate(-1)} 
          className="mb-4 inline-block cursor-pointer"
        >
          <BackButton />
        </div>
        <h1 className="text-3xl font-bold mb-6">Manager Dashboard</h1>

        <div className="flex space-x-4 mb-6">
          {["day","roles","invite","assign","notifications","fairness"].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded ${
                view===v
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {v==="day"     ? "By Day"
              : v==="roles"   ? "Manage Roles"
              : v==="invite"  ? "Invite"
              : v==="assign"       ? "Assign Shifts"
              : v==="notifications"? "Notifications"
              : "Fairness Analytics"}
            </button>
          ))}
        </div>

        {view === "day" && (
          <div className="w-full max-w-3xl bg-gray-900 p-6 rounded-lg mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-white">Employee Availability</h2>
            <Calendar
              // react-calendar expects onChange/value for controlled selection
              onChange={onDayClick}
              value={selectedDate ? new Date(selectedDate) : null}
              className="custom-calendar mx-auto"
            />

            {selectedDate && (
              <ul className="mt-6 space-y-3">
                {availabilityByDate.map(u => (
                  <li key={u.id} className="bg-gray-800 p-4 rounded text-white">
                    <div className="font-semibold">{u.name}</div>
                    {u.slots.length > 0 ? (
                      <ul className="ml-4 list-disc">
                        {u.slots.map(s => {
                          const start = new Date(s.start_time)
                            .toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                          const end = new Date(s.end_time)
                            .toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                          return (
                            <li key={s.id} className="text-red-400">
                              {start} – {end}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-green-400">Available</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {view === "roles" && <ManageRolesView />}

        {view === "invite"         && <InviteView />}

        {view === "assign"         && <AssignShiftsView />}

        {view === "notifications"  && <NotificationsView />}

        {view === "fairness"       && <FairnessAnalyticsView />}
      </div>
    </div>
  );
}