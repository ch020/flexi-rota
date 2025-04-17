import React, { useState } from 'react';
//import './ChatPage.css'; // Optional: Add styles for the chat page

const ChatPage = () => {
    const [employees, setEmployees] = useState(['Alice', 'Bob', 'Charlie']);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [messages, setMessages] = useState({});
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (newMessage.trim() === '' || !selectedEmployee) return;

        // Add the new message to the chat for the selected employee
        setMessages({
            ...messages,
            [selectedEmployee]: [
                ...(messages[selectedEmployee] || []),
                { sender: 'You', text: newMessage },
            ],
        });
        setNewMessage('');
    };

    return (
        <div className="chat-page">
            <h1>Employee Chat</h1>
            <div className="chat-container">
                <div className="employee-list">
                    <h2>Employees</h2>
                    <ul>
                        {employees.map((employee) => (
                            <li
                                key={employee}
                                className={selectedEmployee === employee ? 'selected' : ''}
                                onClick={() => setSelectedEmployee(employee)}
                            >
                                {employee}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="chat-messages-container">
                    {selectedEmployee ? (
                        <>
                            <h2>Chat with {selectedEmployee}</h2>
                            <div className="chat-messages">
                                {(messages[selectedEmployee] || []).map((message, index) => (
                                    <div
                                        key={index}
                                        className={`chat-message ${
                                            message.sender === 'You' ? 'self' : 'other'
                                        }`}
                                    >
                                        <strong>{message.sender}:</strong> {message.text}
                                    </div>
                                ))}
                            </div>
                            <div className="chat-input">
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button onClick={handleSendMessage}>Send</button>
                            </div>
                        </>
                    ) : (
                        <div className="chat-placeholder">
                            <h2>Vos messages</h2>
                            <p>
                                Envoyez des photos et des messages privés à un(e) ami(e) ou à un groupe
                            </p>
                            <button onClick={() => alert('Start a new chat')}>
                                Envoyer un message
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;