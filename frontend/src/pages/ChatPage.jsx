import React, { useState } from 'react';
import './ChatPage.css'; // Don't forget to import your CSS

const ChatPage = () => {
    const [employees, setEmployees] = useState(['Alice', 'Bob', 'Charlie']);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [messages, setMessages] = useState({});
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (newMessage.trim() === '' || !selectedEmployee) return;

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
            <div className="chat-container">
                <div className="employee-list">
                    <h2>Messages</h2>
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
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <button onClick={handleSendMessage}>Send</button>
                            </div>
                        </>
                    ) : (
                        <div className="chat-placeholder">
                            <h2>your messages</h2>
                            <p>
                                send pictures or messages to a friend
                            </p>
                            <button onClick={() => alert('Start a new chat')}>
                                send a message
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;