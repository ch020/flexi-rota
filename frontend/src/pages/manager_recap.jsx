import React, {useEffect, useState} from 'react';
import api from '../services/api';
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

const useEmployeeAvailability = () => {
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulated data
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
//test
// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const EmployeeAvailability = () => {
    const { availabilityData, loading, error } = useEmployeeAvailability();
  
    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
  
    const hours = Array.from({ length: 17 }, (_, i) => `${i + 8}:00`);
    const names = availabilityData.map((employee) => employee.name);
  
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <table style={{ borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '5px' }}>Hour</th>
              {names.map((name) => (
                <th key={name} style={{ border: '1px solid black', padding: '5px' }}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                  {hour}
                </td>
                {names.map((name) => {
                  const employee = availabilityData.find((e) => e.name === name);
                  const isAvailable = employee.availability.includes(hour);
                  return (
                    <td
                      key={`${hour}-${name}`}
                      style={{
                        border: '1px solid black',
                        padding: '5px',
                        textAlign: 'center',
                        backgroundColor: isAvailable ? 'lightgreen' : 'white',
                      }}
                    >
                      {isAvailable ? '✔' : ''}
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