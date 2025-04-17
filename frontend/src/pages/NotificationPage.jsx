import React, { useState } from 'react';
import './NotificationPage.css'; // Import the CSS file

const NotificationPage = () => {
    // Example notifications data
    const notifications = [
        { id: 1, message: 'Your shift has been updated.', timestamp: '2023-10-01 10:00 AM', details: 'Your shift on October 5th has been changed to 2:00 PM - 10:00 PM. Please confirm your availability.' },
        { id: 2, message: 'New training session scheduled.', timestamp: '2023-10-02 2:30 PM', details: 'A mandatory training session on food safety has been scheduled for October 10th at 3:00 PM in the main conference room.' },
        { id: 3, message: 'Payroll processed.', timestamp: '2023-10-03 8:15 AM', details: 'Your payroll for the month of September has been processed and will be deposited into your account by October 5th.' },
    ];

    const [expandedNotificationId, setExpandedNotificationId] = useState(null);

    const toggleNotification = (id) => {
        setExpandedNotificationId((prevId) => (prevId === id ? null : id));
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
                            onClick={() => toggleNotification(notification.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <p className="notification-message">{notification.message}</p>
                            <span className="notification-timestamp">{notification.timestamp}</span>
                            <div>
                                {expandedNotificationId === notification.id && (
                                    <p className="notification-details">{notification.details}</p>
                                )}
                            </div>
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
