import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './ManagerRecapPage.css'; // 👈 Import the CSS file
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

const useEmployeeAvailability = () => {
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    const simulatedData = [
      {
        name: 'Alice',
        availability: ['8:00', '9:00', '10:00', '11:00'],
      },
      {
        name: 'Bob',
        availability: ['10:00', '11:00', '12:00', '13:00'],
      },
      {
        name: 'Charlie',
        availability: ['14:00', '15:00', '16:00', '17:00'],
      },
    ];
    setAvailabilityData(simulatedData);
    setLoading(false);

  }, []);

  return { availabilityData, loading, error };
};


const EmployeeAvailability = () => {
  const { availabilityData, loading, error } = useEmployeeAvailability();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  const hours = Array.from({ length: 10 }, (_, i) => `${i + 8}:00`);
  const names = availabilityData.map((employee) => employee.name);

  return (
    <div className="availability-container">
      <h2 className="availability-title">Employee Availability</h2>
      <table className="availability-table">
        <thead>
          <tr>
            <th>Hour</th>
            {names.map((name) => (
              <th key={name}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <td>{hour}</td>
              {names.map((name) => {
                const employee = availabilityData.find((e) => e.name === name);
                const isAvailable = employee.availability.includes(hour);
                return (
                  <td key={`${hour}-${name}`}>
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

export default EmployeeAvailability;