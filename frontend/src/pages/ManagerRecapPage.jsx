import React, { useEffect, useState } from 'react';
import './ManagerRecapPage.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const useEmployeeAvailability = () => {
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const simulatedData = [
      {
        name: 'Alice',
        availability: ['8:00', '9:00', '10:00', '11:00'],
        weeklyAvailability: {
          Monday: ['8:00', '9:00'],
          Tuesday: ['10:00'],
          Wednesday: [],
          Thursday: ['11:00'],
          Friday: ['8:00'],
        },
      },
      {
        name: 'Bob',
        availability: ['10:00', '11:00', '12:00', '13:00'],
        weeklyAvailability: {
          Monday: [],
          Tuesday: ['10:00'],
          Wednesday: ['11:00'],
          Thursday: ['12:00'],
          Friday: ['13:00'],
        },
      },
      {
        name: 'Charlie',
        availability: ['14:00', '15:00', '16:00', '17:00'],
        weeklyAvailability: {
          Monday: ['14:00'],
          Tuesday: [],
          Wednesday: ['15:00'],
          Thursday: ['16:00'],
          Friday: ['17:00'],
        },
      },
    ];
    setAvailabilityData(simulatedData);
    setLoading(false);
  }, []);

  return { availabilityData, loading };
};

// Hourly View
const HourlyView = ({ availabilityData }) => {
  const hours = Array.from({ length: 33 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minutes = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minutes}`;
  });
  const names = availabilityData.map((e) => e.name);

  return (
    <div className="availability-container">
      <h2>Employee Hourly Availability</h2>
      <table className="availability-table">
        <thead>
          <tr>
            <th>Time</th>
            {names.map((name) => (
              <th key={name}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((time) => (
            <tr key={time}>
              <td>{time}</td>
              {names.map((name) => {
                const employee = availabilityData.find((e) => e.name === name);
                const isAvailable = employee.availability.includes(time);
                return (
                  <td key={`${time}-${name}`}>
                    {isAvailable ? <span className="available">✔</span> : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Weekly View
const DaySelectorView = ({ availabilityData }) => {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="availability-container">
      <h2 className="availability-title">Employee Weekly Availability</h2>
      <div className="hour-selector">
        <label htmlFor="day-select">Choose a day:</label>
        <select
          id="day-select"
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
        >
          {daysOfWeek.map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      <ul className="day-availability-list">
        {availabilityData.map((employee) => {
          const slots = employee.weeklyAvailability?.[selectedDay];
          const isAvailable = slots && slots.length > 0;

          return (
            <li key={employee.name}>
              <span>{employee.name}</span>
              <span className={isAvailable ? 'available-label' : 'unavailable-label'}>
                {isAvailable ? slots.join(', ') : 'Unavailable'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// Invite Link Generator
const GenerateInviteButton = () => {
  const [inviteLink, setInviteLink] = useState('');
  const [error, setError] = useState('');

  const handleGenerateInvite = async () => {
    try {
      const response = await fetch('/api/generate-invite/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to generate invite');
      const data = await response.json();
      setInviteLink(data.invite_link || '');
      setError('');
    } catch (err) {
      console.error(err);
      setInviteLink('');
      setError('Could not generate invite link. Are you logged in as manager?');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <button onClick={handleGenerateInvite}>Generate Invite Link</button>
      {inviteLink && (
        <p>
          Invite Link:{' '}
          <a href={inviteLink} target="_blank" rel="noopener noreferrer">
            {inviteLink}
          </a>
        </p>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

// Role Management View
const RoleManagerView = ({ users, setUsers }) => {
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  const handleRoleUpdate = async () => {
    try {
      const response = await fetch(`/api/users/${editingUser.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) throw new Error('Failed to update role');
      const updatedUser = await response.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  if (!users || users.length === 0) {
    return <p>No users found.</p>;
  }

  return (
    <div className="employee-list">
      <h2>Employees</h2>
      <ul>
        {users.map((user) => (
          <li
            key={user.id}
            className="editable-user"
            onClick={() => {
              setEditingUser(user);
              setSelectedRole(user.role);
            }}
            style={{ cursor: 'pointer', marginBottom: '8px' }}
          >
            {user.username} ({user.role})
          </li>
        ))}
      </ul>

      {editingUser && (
        <div className="role-editor">
          <h3>Change role for {editingUser.username}</h3>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
          <div style={{ marginTop: '10px' }}>
            <button onClick={handleRoleUpdate}>Save</button>
            <button onClick={() => setEditingUser(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Page
const ManagerRecapPage = () => {
  const { availabilityData, loading } = useEmployeeAvailability();
  const [view, setView] = useState('hourly');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users/', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Loading availability data...</p>;

  return (
    <div className="manager-layout">
      <div className="sidebar">
        <button
          className={`sidebar-btn ${view === 'hourly' ? 'active' : ''}`}
          onClick={() => setView('hourly')}
        >
          View Hourly Table
        </button>
        <button
          className={`sidebar-btn ${view === 'weekly' ? 'active' : ''}`}
          onClick={() => setView('weekly')}
        >
          View by Day
        </button>
        <button
          className={`sidebar-btn ${view === 'roles' ? 'active' : ''}`}
          onClick={() => setView('roles')}
        >
          Manage Roles
        </button>
        <button
          className={`sidebar-btn ${view === 'invite' ? 'active' : ''}`}
          onClick={() => setView('invite')}
        >
          Generate Invite
        </button>
      </div>
  
      <div className="main-content">
        {view === 'hourly' && <HourlyView availabilityData={availabilityData} />}
        {view === 'weekly' && <DaySelectorView availabilityData={availabilityData} />}
        {view === 'roles' && <RoleManagerView users={users} setUsers={setUsers} />}
        {view === 'invite' && <GenerateInviteButton />}
      </div>
    </div>
  );
};

export default ManagerRecapPage;