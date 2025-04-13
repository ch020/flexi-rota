import {useEffect, useState} from 'react';
import api from '../services/api';

const useEmployeeAvailability = () => {
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await api.get('/availability'); // Adjust endpoint as needed
        setAvailabilityData(response.data);
      } catch (err) {
        setError('Failed to fetch employee availability.');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  return { availabilityData, loading, error };
};


const EmployeeAvailability = () => {
  const { availabilityData, loading, error } = useEmployeeAvailability();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Employee Availability</h1>
      <table>
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Availability</th>
          </tr>
        </thead>
        <tbody>
          {availabilityData.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.name}</td>
              <td>{employee.availability}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeAvailability;