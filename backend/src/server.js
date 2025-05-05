const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Email transporter (configure with your SMTP or Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS  // your email password or app password
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yopy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: String
});
const User = mongoose.model('User', userSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  text: String,
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// JWT Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

// Registration with email verification
app.post('/api/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) return res.status(400).json({ error: 'Missing fields' });
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ error: 'Email or username already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = new User({ email, username, passwordHash, verificationToken });
    await user.save();

    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${verificationToken}&email=${email}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your Yopy account',
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your account.</p>`
    });

    res.status(201).json({ message: 'User registered. Please check your email to verify your account.' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Email verification endpoint
app.get('/api/verify', async (req, res) => {
  const { token, email } = req.query;
  const user = await User.findOne({ email, verificationToken: token });
  if (!user) return res.status(400).json({ error: 'Invalid verification link' });
  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();
  res.json({ message: 'Email verified! You can now log in.' });
});

// Login (check isVerified)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Email not verified' });
    }
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: user.username, userId: user._id });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all users (for adding/chatting)
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, 'username email _id');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Get messages between users
app.get('/api/messages', authMiddleware, async (req, res) => {
  try {
    const { recipient } = req.query;
    const userId = req.user.userId;
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient },
        { sender: recipient, recipient: userId }
      ]
    }).sort({ timestamp: 1 }).populate('sender', 'username').populate('recipient', 'username');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Send a message
app.post('/api/messages', authMiddleware, async (req, res) => {
  try {
    const { text, recipient } = req.body;
    const sender = req.user.userId;
    if (!text || !recipient) return res.status(400).json({ error: 'Missing fields' });
    const message = new Message({ text, sender, recipient });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Error sending message' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 