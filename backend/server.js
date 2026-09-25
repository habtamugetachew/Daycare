const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedAll = require('./config/seed');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();


const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://mintdaycare.netlify.app'
];
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const checkCorsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (
    allowedOrigins.includes(origin) ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')
  ) {
    return callback(null, true);
  }
  return callback(null, true);
};

const compression = require('compression');

// Socket.io initialization with memory-safe timeouts
const io = new Server(server, {
  cors: {
    origin: checkCorsOrigin,
    credentials: true
  },
  pingTimeout: 20000,
  pingInterval: 25000
});

// Map to track online users: userId -> socketId
const connectedUsers = new Map();

io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    if (userId) {
      connectedUsers.set(userId.toString(), socket.id);
    }
  });

  socket.on('disconnect', () => {
    // Remove the disconnected socket from the map
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    // Clean up event listeners to allow garbage collection
    socket.removeAllListeners();
  });

  socket.on('error', () => {
    socket.disconnect(true);
  });
});

// Attach io and connectedUsers to the app so controllers can access them
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// ── Performance & Memory Middlewares ───────────────────────
// Gzip compression: drastically reduces payload sizes and egress bandwidth
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Stream & Request cleanup: proactively tear down aborted connections to prevent buffer leaks
app.use((req, res, next) => {
  res.on('close', () => {
    if (!res.writableEnded) {
      res.destroy();
    }
  });
  next();
});

// Middleware
app.use(cors({
  origin: checkCorsOrigin,
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/children', require('./routes/children'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/teacher-attendance', require('./routes/teacherAttendance'));
app.use('/api/live-stream', require('./routes/liveStream'));
app.use('/api/settings', require('./routes/settings'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Keep-Alive / Health Check Endpoints (Render Free Tier Ping) ──
// Lightweight endpoint without database overhead to prevent Render sleep state
const handleHealthCheck = (req, res) => {
  const now = new Date();
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  console.log(`[Keep-Alive Ping] 🟢 Health check received at ${now.toISOString()} | IP: ${clientIp}`);

  res.status(200).json({
    status: 'ok',
    timestamp: now
  });
};

app.get('/api/health', handleHealthCheck);
app.get('/health', handleHealthCheck);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedAll();

    server.listen(PORT, () => {
      console.log(`\n🚀 DaycareHQ Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
