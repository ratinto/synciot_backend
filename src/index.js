require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const robotRoutes = require('./routes/robots');
const sensorRoutes = require('./routes/sensors');

const app = express();
const PORT = process.env.PORT || 3001;

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:5173', 'https://synciot-frontend.vercel.app'],
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/robots', robotRoutes);
app.use('/api/sensors', sensorRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'PostgreSQL'}`);
}).on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;

