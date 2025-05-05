import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = '';

function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [view, setView] = useState(token && user ? 'find-users' : 'login'); // 'login', 'register', 'verify', 'find-users', 'chat'
  const [verifyMsg, setVerifyMsg] = useState('');

  // Registration/Login form state
  const [regForm, setRegForm] = useState({ email: '', username: '', password: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [authMsg, setAuthMsg] = useState('');

  // User list and chat state
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthMsg('');
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regForm)
    });
    const data = await res.json();
    if (res.ok) {
      setView('verify');
      setVerifyMsg(data.message);
    } else {
      setAuthMsg(data.error || 'Registration failed');
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthMsg('');
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      setUser({ username: data.username, userId: data.userId });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ username: data.username, userId: data.userId }));
      setView('find-users');
    } else {
      setAuthMsg(data.error || 'Login failed');
    }
  };

  // Handle email verification (if /verify?token=...&email=... in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    if (window.location.pathname === '/verify' && token && email) {
      setView('verify');
      fetch(`${API_BASE}/api/verify?token=${token}&email=${email}`)
        .then(res => res.json())
        .then(data => setVerifyMsg(data.message || data.error));
    }
  }, []);

  // Fetch users after login
  useEffect(() => {
    if (token && (view === 'find-users' || view === 'chat')) {
      fetch(`${API_BASE}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(setUsers);
    }
  }, [token, view]);

  // Fetch messages when a user is selected
  useEffect(() => {
    if (token && selectedUser && view === 'chat') {
      fetch(`${API_BASE}/api/messages?recipient=${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(setMessages);
    }
  }, [token, selectedUser, view]);

  // Send a message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text: newMessage, recipient: selectedUser._id })
    });
    setNewMessage('');
    // Refresh messages
    fetch(`${API_BASE}/api/messages?recipient=${selectedUser._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setMessages);
  };

  // Logout
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('login');
  };

  // UI rendering
  if (view === 'register') {
    return (
      <div className="auth-container">
        <div className="gator-logo-box">
          <img src="/gator-icon.svg" alt="Yopy Gator" className="gator-logo" />
        </div>
        <h1 className="yopy-title">yopy</h1>
        <h2>Register</h2>
        <form onSubmit={handleRegister} className="auth-form">
          <input type="email" placeholder="Email" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} required />
          <input type="text" placeholder="Username" value={regForm.username} onChange={e => setRegForm(f => ({ ...f, username: e.target.value }))} required />
          <input type="password" placeholder="Password" value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} required />
          <button type="submit">Register</button>
        </form>
        {authMsg && <div className="auth-error">{authMsg}</div>}
        <p>Already have an account? <button onClick={() => setView('login')} className="link-button">Login</button></p>
      </div>
    );
  }
  if (view === 'login') {
    return (
      <div className="auth-container">
        <div className="gator-logo-box">
          <img src="/gator-icon.svg" alt="Yopy Gator" className="gator-logo" />
        </div>
        <h1 className="yopy-title">yopy</h1>
        <h2>Login</h2>
        <form onSubmit={handleLogin} className="auth-form">
          <input type="email" placeholder="Email" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} required />
          <input type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required />
          <button type="submit">Login</button>
        </form>
        {authMsg && <div className="auth-error">{authMsg}</div>}
        <p>Don't have an account? <button onClick={() => setView('register')} className="link-button">Register</button></p>
      </div>
    );
  }
  if (view === 'verify') {
    return (
      <div className="auth-container">
        <div className="gator-logo-box">
          <img src="/gator-icon.svg" alt="Yopy Gator" className="gator-logo" />
        </div>
        <h1 className="yopy-title">yopy</h1>
        <h2>Email Verification</h2>
        <div>{verifyMsg}</div>
        <button onClick={() => setView('login')} className="link-button">Go to Login</button>
      </div>
    );
  }
  if (token && user && view === 'find-users') {
    return (
      <div className="app-container">
        <div className="app-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="yopy-title">yopy</h1>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
        <div className="user-list-page">
          <h2>Find Users</h2>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="user-search"
          />
          <ul>
            {users.filter(u => u._id !== user.userId && (u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))).map(u => (
              <li key={u._id} onClick={() => { setSelectedUser(u); setView('chat'); }}>
                {u.username} ({u.email})
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  if (token && user && view === 'chat') {
    return (
      <div className="app-container">
        <div className="app-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="yopy-title">yopy</h1>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
        <button className="back-btn" onClick={() => setView('find-users')}>Back to Users</button>
        <div className="chat-container">
          {selectedUser ? (
            <>
              <div className="chat-header">Chat with {selectedUser.username}</div>
              <div className="messages">
                {messages.map((message, index) => (
                  <div key={index} className={message.sender._id === user.userId ? 'message own' : 'message'}>
                    <strong>{message.sender.username}:</strong> {message.text}
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="message-form">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  required
                />
                <button type="submit">Send</button>
              </form>
            </>
          ) : (
            <div className="select-user">Select a user to start chatting.</div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export default App; 