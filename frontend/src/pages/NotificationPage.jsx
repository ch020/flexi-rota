import React, { useState } from 'react';
import './NotificationPage.css'; // Import the CSS file

const NotificationPage = () => {
    // Example notifications data
    const notifications = [
        { id: 1, message: 'Your shift has been updated.', timestamp: '2023-10-01 10:00 AM' },
        { id: 2, message: 'New training session scheduled.', timestamp: '2023-10-02 2:30 PM' },
        { id: 3, message: 'Payroll processed.', timestamp: '2023-10-03 8:15 AM' },
    ];

    const [readNotifications, setReadNotifications] = useState({});

    const toggleReadStatus = (id) => {
        setReadNotifications((prevState) => ({
            ...prevState,
            [id]: !prevState[id],
        }));
    };

    const [highlightedNotificationId, setHighlightedNotificationId] = useState(null);

    const toggleNotificationHighlight = (id) => {
        setHighlightedNotificationId((prevId) => (prevId === id ? null : id));
    };

    return (
        <div className="notification-page">
            <h1>Notifications</h1>
            {notifications.length > 0 ? (
                <ul className="notification-list">
                    {notifications.map((notification) => (
                        <li
                            key={notification.id}
                            className="notification-item"
                            onClick={() => toggleNotificationHighlight(notification.id)}
                            style={{
                                cursor: 'pointer',
                                backgroundColor: highlightedNotificationId === notification.id ? 'lightblue' : 'transparent',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={!!readNotifications[notification.id]}
                                onChange={() => toggleReadStatus(notification.id)}
                                style={{ marginRight: '10px' }}
                            />
                            <p className="notification-message">{notification.message}</p>
                            <span className="notification-timestamp">{notification.timestamp}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No notifications available.</p>
            )}
        </div>
    );
};

export default NotificationPage;
