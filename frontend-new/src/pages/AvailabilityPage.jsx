import React, {useEffect, useState} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import api from '../services/api';

const AvailabilityPage = () => {
    const [events, setEvents] = useState([]);

    const fetchAvailability = async () => {
        const res = await api.get('availability/');
        const formatted = res.data.map(item => ({
            title: item.is_available ? 'Available' : 'Unavailable',
            date: item.date,
            color: item.is_available ? 'green' : 'red',
        }));
        setEvents(formatted);
    };

    useEffect(() => {
        fetchAvailability();
    }, []);

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">My Availability</h2>
            <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={events}
            />
        </div>
    );
};

export default AvailabilityPage;