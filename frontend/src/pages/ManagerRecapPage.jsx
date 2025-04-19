import React, { useEffect, useState } from 'react';
import './ManagerRecapPage.css'; // CSS for styling
import { Bar } from 'react-chartjs-2';
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

// Employee data hook with API call
const useEmployeeAvailability = () => {
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailabilityData = async () => {
      try {
        const response = await fetch('/api/employee-availability'); // Replace with your API endpoint
        if (!response.ok) {
          throw new Error('Failed to fetch availability data');
        }
        const data = await response.json();
        setAvailabilityData(data);
      } catch (error) {
        console.error('Error fetching availability data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilityData();
  }, []);

  return { availabilityData, loading };
};

// Hourly availability table view
const HourlyView = ({ availabilityData }) => {
  const hours = Array.from({ length: 33 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minutes = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minutes}`;
  });
  const names = availabilityData.map((employee) => employee.name);

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

// New view: select a day and see availability

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


// Main component
const ManagerRecapPage = () => {
  const { availabilityData, loading } = useEmployeeAvailability();
  const [view, setView] = useState('hourly'); // 'hourly' or 'weekly'

  if (loading) return <p>Loading...</p>;

  return (
    <div className="availability-container">
      <div className="view-buttons">
        <button onClick={() => setView('hourly')}>View Hourly Table</button>
        <button onClick={() => setView('weekly')}>View by Day</button>
      </div>
      {view === 'hourly' ? (
        <HourlyView availabilityData={availabilityData} />
      ) : (
        <DaySelectorView availabilityData={availabilityData} />
      )}
    </div>
  );
};

export default ManagerRecapPage;