require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const { seedDatabase } = require('./config/seed');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', credentials: true } });
const PORT = process.env.PORT || 3000;


app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'rf_attendance_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

// Pass Socket.IO to routes via middleware
app.use((req, res, next) => { req.io = io; next(); });

// Serve React production build
const clientDist = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDist));

// API Routes
app.use('/api', require('./routes/auth'));
app.use('/api/student', require('./routes/student'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/admin', require('./routes/admin'));

// SPA fallback — serve React index.html for all non-API routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Socket.IO connections
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('disconnect', () => console.log('🔌 Client disconnected:', socket.id));
});

// ─── Start ────────────────────────────────────────────────
async function start() {
  await connectDB();
  await seedDatabase();

  server.listen(PORT, () => {
    console.log('');
    console.log('🎓  RF Attendance System – MERN Edition');
    console.log(`🌐  App           : http://localhost:${PORT}`);
    console.log(`🔌  Socket.IO     : ws://localhost:${PORT}`);
    console.log('');
  });
}

start().catch(err => { console.error('Startup error:', err); process.exit(1); });

module.exports = { app, server, io };
