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
        <h1 className="yopy-title">yopy</h1>
      </div>
      <div className="welcome-panel">
        <h2>Welcome to Yopy Chat!</h2>
        <p>Connect, chat, and have fun with your friends. 🐊</p>
      </div>
      <div className="chat-container">
        <div className="gator-logo-box">
          <img src="/gator-icon.svg" alt="Gator Icon" className="gator-logo" />
        </div>
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
      <footer className="app-footer">
        <span>© 2024 yopy</span>
      </footer>
    </div>
  );
}

export default App; 