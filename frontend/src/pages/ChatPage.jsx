import React, { useState } from 'react';
import './ChatPage.css';

const ChatPage = () => {
  const [employees, setEmployees] = useState(['Alice', 'Bob', 'Charlie']);
  const [selectedChat, setSelectedChat] = useState(null); // name or group name
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groupName, setGroupName] = useState('');

  const allChats = [...employees, ...Object.keys(messages).filter(k => k.startsWith('Group:'))];

  const handleSendMessage = () => {
    if (newMessage.trim() === '' || !selectedChat) return;

    setMessages((prev) => ({
      ...prev,
      [selectedChat]: [
        ...(prev[selectedChat] || []),
        { sender: 'You', text: newMessage },
      ],
    }));

    setNewMessage('');
  };

  const handleCreateGroup = () => {
    if (!groupName || selectedGroupMembers.length < 2) return;

    const name = `Group: ${groupName}`;
    setMessages((prev) => ({
      ...prev,
      [name]: [],
    }));
    setSelectedChat(name);
    setIsCreatingGroup(false);
    setSelectedGroupMembers([]);
    setGroupName('');
  };

  const toggleGroupMember = (member) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member]
    );
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="employee-list">
          <h2>Messages</h2>
          <ul>
            {allChats.map((chat) => {
                const isGroup = chat.startsWith('Group:');
                const displayName = isGroup ? chat.replace('Group: ', '') : chat;

                return (
                <li
                    key={chat}
                    className={`chat-item ${selectedChat === chat ? 'selected' : ''} ${isGroup ? 'group-chat' : ''}`}
                    onClick={() => setSelectedChat(chat)}
                >
                    {displayName}
                </li>
                );
            })}
            </ul>
          <button onClick={() => setIsCreatingGroup(!isCreatingGroup)}>
            {isCreatingGroup ? 'Cancel' : 'Create Group'}
          </button>

          {isCreatingGroup && (
            <div className="group-creator">
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <div className="group-members">
                {employees.map((emp) => (
                  <label key={emp}>
                    <input
                      type="checkbox"
                      checked={selectedGroupMembers.includes(emp)}
                      onChange={() => toggleGroupMember(emp)}
                    />
                    {emp}
                  </label>
                ))}
              </div>
              <button onClick={handleCreateGroup}>Confirm Group</button>
            </div>
          )}
        </div>

        <div className="chat-messages-container">
          {selectedChat ? (
            <>
              <h2>{selectedChat}</h2>
              <div className="chat-messages">
                {(messages[selectedChat] || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chat-message ${
                      msg.sender === 'You' ? 'self' : 'other'
                    }`}
                  >
                    <strong>{msg.sender}:</strong> {msg.text}
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage}>Send</button>
              </div>
            </>
          ) : (
            <div className="chat-placeholder">
              <h2>Your Messages</h2>
              <p>Send pictures or messages to a friend</p>
              <button onClick={() => alert('Start a new chat')}>
                Send a Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;