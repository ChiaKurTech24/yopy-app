import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Fetch messages every 2 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !username.trim()) return;

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newMessage,
          username: username,
        }),
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="app-container">
      <div className="app-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <img src="/gator.gif" alt="Yopy Gator Logo" style={{ height: '80px', marginBottom: '1rem' }} />
        <h1 style={{ fontFamily: 'cursive', color: '#2ecc40', fontWeight: 'bold' }}>yopy</h1>
      </div>
      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className="message">
              <strong>{message.username}:</strong> {message.text}
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="message-form">
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            required
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App; 